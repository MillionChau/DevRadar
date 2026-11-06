import React, { useState, useRef, useEffect } from 'react';
import { useTheme, Theme } from '../../context/ThemeContext';
import { AppIcon } from './Icon';
import { Tooltip } from './Tooltip';

interface ThemeToggleProps {
  variant?: 'icon' | 'dropdown' | 'segmented';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'dropdown', className = '' }) => {
  const { theme, isDark, setTheme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options: { value: Theme; label: string; icon: string }[] = [
    { value: 'light', label: 'Giao diện sáng', icon: 'sun' },
    { value: 'dark', label: 'Giao diện tối', icon: 'moon' },
    { value: 'system', label: 'Theo hệ thống', icon: 'monitor' },
  ];

  if (variant === 'segmented') {
    return (
      <div className={`inline-flex p-1 bg-surface-elevated/70 border border-surface-border rounded-btn gap-1 ${className}`}>
        {options.map((opt) => {
          const isActive = theme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-all ${
                isActive
                  ? 'bg-surface-card text-brand-primary shadow-sm font-semibold'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              <AppIcon name={opt.icon} size={13} className={isActive ? 'text-brand-primary' : 'text-text-subtle'} />
              <span>{opt.value === 'light' ? 'Sáng' : opt.value === 'dark' ? 'Tối' : 'Hệ thống'}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'icon') {
    return (
      <Tooltip content={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'} position="bottom">
        <button
          type="button"
          onClick={toggleTheme}
          className={`p-2 rounded-btn text-text-muted hover:text-text-main hover:bg-surface-elevated transition-colors ${className}`}
          aria-label="Đổi giao diện sáng/tối"
        >
          <AppIcon
            name={isDark ? 'sun' : 'moon'}
            size={18}
            className={`transition-transform duration-300 ${isDark ? 'text-amber-400 hover:rotate-45' : 'text-indigo-400 hover:-rotate-12'}`}
          />
        </button>
      </Tooltip>
    );
  }

  // Default: Dropdown Toggle
  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <Tooltip content={`Giao diện: ${theme === 'light' ? 'Sáng' : theme === 'dark' ? 'Tối' : 'Hệ thống'}`} position="bottom">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`p-2 rounded-btn transition-all flex items-center justify-center ${
            isOpen
              ? 'bg-surface-elevated text-brand-primary'
              : 'text-text-muted hover:text-text-main hover:bg-surface-elevated'
          }`}
          aria-label="Cài đặt giao diện màu sáng/tối"
        >
          <AppIcon
            name={isDark ? 'sun' : 'moon'}
            size={18}
            className={`transition-transform duration-300 ${isDark ? 'text-amber-400 hover:rotate-45' : 'text-indigo-500 hover:-rotate-12'}`}
          />
        </button>
      </Tooltip>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-surface-card border border-surface-border rounded-card shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
          <div className="px-2.5 py-1.5 text-[11px] font-bold text-text-subtle uppercase tracking-wider border-b border-surface-border/50 mb-1">
            Chế độ giao diện
          </div>
          {options.map((opt) => {
            const isSelected = theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setTheme(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-btn transition-colors text-left ${
                  isSelected
                    ? 'bg-brand-primary/10 text-brand-primary font-semibold'
                    : 'text-text-muted hover:text-text-main hover:bg-surface-elevated'
                }`}
              >
                <div className="flex items-center gap-2">
                  <AppIcon
                    name={opt.icon}
                    size={14}
                    className={
                      opt.value === 'light'
                        ? 'text-amber-500'
                        : opt.value === 'dark'
                        ? 'text-indigo-400'
                        : 'text-text-subtle'
                    }
                  />
                  <span>{opt.label}</span>
                </div>
                {isSelected && (
                  <AppIcon name="check" size={13} className="text-brand-primary" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
