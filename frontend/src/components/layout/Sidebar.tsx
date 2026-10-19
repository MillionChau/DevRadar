import React from 'react';
import { NavLink } from 'react-router-dom';
import { AppIcon, IconName } from '../common/Icon';
import Badge from '../common/Badge';
import { useAuth } from '../../context/AuthContext';

interface SidebarItem {
  label: string;
  path: string;
  icon: IconName;
  badge?: string;
  requireAuth?: boolean;
}

export const Sidebar: React.FC = () => {
  const { role } = useAuth();

  const exploreItems: SidebarItem[] = [
    { label: 'Tất cả bài viết', path: '/', icon: 'home' },
    { label: 'Đang thịnh hành', path: '/trending', icon: 'trending' },
    { label: 'Đang theo dõi', path: '/following', icon: 'compass', requireAuth: true },
  ];

  const personalItems: SidebarItem[] = [
    { label: 'Bài viết của tôi', path: '/profile/me', icon: 'fileText', requireAuth: true },
    { label: 'Đã lưu (Bookmarks)', path: '/bookmarks', icon: 'bookmark', requireAuth: true },
    { label: 'GitHub Analytics', path: '/analytics/repo-health', icon: 'radar' },
  ];

  const techZones = [
    { name: '#dotnet', path: '/techzones/dotnet' },
    { name: '#react', path: '/techzones/react' },
    { name: '#microservices', path: '/techzones/microservices' },
    { name: '#devops', path: '/techzones/devops' },
    { name: '#ai-quality', path: '/techzones/ai-quality' },
  ];

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-btn transition-colors ${
      isActive
        ? 'bg-brand-primary/10 text-brand-secondary font-semibold border-l-2 border-brand-secondary'
        : 'text-text-muted hover:bg-surface-elevated hover:text-text-main'
    }`;

  return (
    <aside className="w-60 flex-shrink-0 hidden md:flex flex-col gap-6 py-6 px-4 bg-surface-card border border-surface-border rounded-card h-fit sticky top-[95px]">
      {/* Exploration Section */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold text-text-subtle tracking-wider uppercase px-3 select-none">
          KHÁM PHÁ
        </span>
        {exploreItems.map((item) => {
          if (item.requireAuth && role === 'Guest') return null;
          return (
            <NavLink key={item.path} to={item.path} className={navClass} end={item.path === '/'}>
              <AppIcon name={item.icon} size={16} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="h-[1px] bg-surface-border" />

      {/* Personal Section */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold text-text-subtle tracking-wider uppercase px-3 select-none">
          CÁ NHÂN
        </span>
        {personalItems.map((item) => {
          if (item.requireAuth && role === 'Guest') return null;
          return (
            <NavLink key={item.path} to={item.path} className={navClass}>
              <AppIcon name={item.icon} size={16} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="h-[1px] bg-surface-border" />

      {/* TechZones Section */}
      <div className="flex flex-col gap-2.5">
        <span className="text-[11px] font-bold text-text-subtle tracking-wider uppercase px-3 select-none">
          TECHZONES HÀNG ĐẦU
        </span>
        <div className="flex flex-wrap gap-1.5 px-2">
          {techZones.map((tz) => (
            <NavLink key={tz.name} to={tz.path}>
              <Badge variant="tech" size="sm">
                {tz.name}
              </Badge>
            </NavLink>
          ))}
        </div>
      </div>

      {/* Admin Quick Link */}
      {(role === 'Admin' || role === 'Moderator') && (
        <>
          <div className="h-[1px] bg-surface-border" />
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-status-warning tracking-wider uppercase px-3 select-none">
              QUẢN TRỊ VIÊN
            </span>
            <NavLink to="/admin/users" className={navClass}>
              <AppIcon name="shield" size={16} />
              <span>Bảng điều khiển Admin</span>
            </NavLink>
          </div>
        </>
      )}
    </aside>
  );
};

export default Sidebar;
