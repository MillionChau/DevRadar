import React from 'react';
import { NavLink } from 'react-router-dom';
import { AppIcon, IconName } from '../common/Icon';
import Badge from '../common/Badge';

interface AdminMenuItem {
  label: string;
  path: string;
  icon: IconName;
  badge?: string;
}

export const AdminSidebar: React.FC = () => {
  const adminItems: AdminMenuItem[] = [
    { label: 'Quản trị tài khoản', path: '/admin/users', icon: 'user' },
    { label: 'Quản lý bài viết', path: '/admin/posts', icon: 'fileText' },
    { label: 'Quản lý báo cáo công nghệ', path: '/admin/tech-reports', icon: 'fileText', badge: 'AI CMS' },
    { label: 'Hàng chờ kiểm duyệt AI', path: '/admin/reports', icon: 'shield', badge: 'HuggingFace' },
    { label: 'Cấu hình TechZone', path: '/admin/techzones', icon: 'layers' },
    { label: 'Giám sát GitHub Crawler', path: '/admin/crawler', icon: 'cpu', badge: 'Port 8000' },
    { label: 'Nhật ký hệ thống (Logs)', path: '/admin/logs', icon: 'terminal', badge: 'Live' },
  ];

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center justify-between px-3.5 py-2.5 text-xs font-medium rounded-btn transition-colors ${
      isActive
        ? 'bg-brand-primary text-white font-semibold shadow-sm'
        : 'text-text-muted hover:bg-surface-elevated hover:text-text-main'
    }`;

  return (
    <aside className="w-64 flex-shrink-0 hidden md:flex flex-col gap-6 py-6 px-4 bg-surface-card border border-surface-border rounded-card h-fit sticky top-[95px]">
      <div className="flex items-center gap-2.5 px-3">
        <div className="w-7 h-7 rounded-btn bg-brand-primary/20 text-brand-secondary flex items-center justify-center">
          <AppIcon name="shield" size={16} />
        </div>
        <div>
          <h4 className="text-xs font-bold text-text-main">ADMIN CONSOLE</h4>
          <span className="text-[10px] text-text-subtle font-mono">DevRadar Governance</span>
        </div>
      </div>

      <div className="h-[1px] bg-surface-border" />

      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold text-text-subtle tracking-wider uppercase px-3 select-none">
          MÔ-ĐUN QUẢN TRỊ
        </span>
        {adminItems.map((item) => (
          <NavLink key={item.path} to={item.path} className={navClass}>
            <div className="flex items-center gap-2.5">
              <AppIcon name={item.icon} size={16} />
              <span>{item.label}</span>
            </div>
            {item.badge && (
              <Badge variant="reputation" size="sm" className="text-[9px] py-0 px-1.5">
                {item.badge}
              </Badge>
            )}
          </NavLink>
        ))}
      </div>

      <div className="h-[1px] bg-surface-border" />

      {/* Return to Community */}
      <NavLink
        to="/"
        className="flex items-center gap-2 px-3 py-2 text-xs text-text-subtle hover:text-text-main transition-colors"
      >
        <AppIcon name="arrowRight" size={14} className="rotate-180" />
        <span>Quay lại Bảng tin</span>
      </NavLink>
    </aside>
  );
};

export default AdminSidebar;
