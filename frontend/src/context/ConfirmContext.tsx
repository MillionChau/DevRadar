import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { AppIcon } from '../components/common/Icon';

export type DialogVariant = 'danger' | 'warning' | 'info' | 'primary';

export interface ConfirmDialogOptions {
  title?: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
  icon?: string;
  isPrompt?: boolean;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
}

export interface ConfirmContextType {
  confirm: (options: ConfirmDialogOptions | string) => Promise<boolean>;
  prompt: (options: ConfirmDialogOptions | string) => Promise<string | null>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

let globalConfirmHandler: ((options: ConfirmDialogOptions | string) => Promise<boolean>) | null = null;
let globalPromptHandler: ((options: ConfirmDialogOptions | string) => Promise<string | null>) | null = null;

export const confirmDialog = {
  confirm: (options: ConfirmDialogOptions | string): Promise<boolean> =>
    globalConfirmHandler ? globalConfirmHandler(options) : Promise.resolve(false),
  prompt: (options: ConfirmDialogOptions | string): Promise<string | null> =>
    globalPromptHandler ? globalPromptHandler(options) : Promise.resolve(null),
};

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<ConfirmDialogOptions | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  const resolveRef = useRef<((value: any) => void) | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleClose = useCallback(
    (result: boolean | string | null) => {
      setIsOpen(false);
      if (resolveRef.current) {
        resolveRef.current(result);
        resolveRef.current = null;
      }
      setTimeout(() => {
        setConfig(null);
        setInputValue('');
        setInputError(null);
      }, 150);
    },
    []
  );

  const confirm = useCallback(
    (options: ConfirmDialogOptions | string): Promise<boolean> => {
      return new Promise<boolean>((resolve) => {
        resolveRef.current = resolve;
        const opts: ConfirmDialogOptions =
          typeof options === 'string'
            ? {
                message: options,
                variant: 'danger',
                confirmText: 'Xác nhận',
                cancelText: 'Hủy',
              }
            : {
                variant: 'danger',
                confirmText: 'Xác nhận',
                cancelText: 'Hủy',
                ...options,
                isPrompt: false,
              };

        setConfig(opts);
        setIsOpen(true);
      });
    },
    []
  );

  const prompt = useCallback(
    (options: ConfirmDialogOptions | string): Promise<string | null> => {
      return new Promise<string | null>((resolve) => {
        resolveRef.current = resolve;
        const opts: ConfirmDialogOptions =
          typeof options === 'string'
            ? {
                message: options,
                variant: 'warning',
                confirmText: 'Đồng ý',
                cancelText: 'Hủy',
                isPrompt: true,
              }
            : {
                variant: 'warning',
                confirmText: 'Đồng ý',
                cancelText: 'Hủy',
                ...options,
                isPrompt: true,
              };

        setConfig(opts);
        setInputValue(opts.defaultValue || '');
        setInputError(null);
        setIsOpen(true);
      });
    },
    []
  );

  useEffect(() => {
    globalConfirmHandler = confirm;
    globalPromptHandler = prompt;
    return () => {
      globalConfirmHandler = null;
      globalPromptHandler = null;
    };
  }, [confirm, prompt]);

  // Focus input on prompt open
  useEffect(() => {
    if (isOpen && config?.isPrompt) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [isOpen, config?.isPrompt]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        handleClose(config?.isPrompt ? null : false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, config?.isPrompt, handleClose]);

  const handleConfirmSubmit = () => {
    if (config?.isPrompt) {
      if (config.required && !inputValue.trim()) {
        setInputError('Vui lòng không để trống thông tin');
        return;
      }
      handleClose(inputValue);
    } else {
      handleClose(true);
    }
  };

  const variant = config?.variant || 'danger';

  // Variant styling
  const variantStyles = {
    danger: {
      icon: 'Trash2',
      iconBg: 'bg-status-danger/15 text-status-danger border-status-danger/30',
      btn: 'bg-status-danger hover:bg-status-danger/90 text-white shadow-status-danger/20',
      defaultTitle: 'Xác nhận xóa dữ liệu',
    },
    warning: {
      icon: 'AlertTriangle',
      iconBg: 'bg-status-warning/15 text-status-warning border-status-warning/30',
      btn: 'bg-status-warning hover:bg-status-warning/90 text-white shadow-status-warning/20',
      defaultTitle: 'Cảnh báo thao tác',
    },
    info: {
      icon: 'AlertCircle',
      iconBg: 'bg-status-info/15 text-status-info border-status-info/30',
      btn: 'bg-brand-primary hover:bg-brand-hover text-white shadow-brand-primary/20',
      defaultTitle: 'Thông báo xác nhận',
    },
    primary: {
      icon: 'CheckCircle',
      iconBg: 'bg-brand-primary/15 text-brand-primary border-brand-primary/30',
      btn: 'bg-brand-primary hover:bg-brand-hover text-white shadow-brand-primary/20',
      defaultTitle: 'Xác nhận hành động',
    },
  }[variant];

  const iconName = config?.icon || variantStyles.icon;
  const title = config?.title || variantStyles.defaultTitle;

  return (
    <ConfirmContext.Provider value={{ confirm, prompt }}>
      {children}

      {isOpen && config && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-md bg-surface-card border border-surface-border rounded-card shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Body with Icon */}
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border ${variantStyles.iconBg}`}
                >
                  <AppIcon name={iconName} size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-text-main leading-snug">{title}</h3>
                  <div className="text-xs text-text-muted mt-1.5 leading-relaxed break-words whitespace-pre-wrap">
                    {config.message}
                  </div>
                </div>
              </div>

              {/* Prompt Input Field */}
              {config.isPrompt && (
                <div className="mt-4 pt-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      if (inputError) setInputError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleConfirmSubmit();
                      }
                    }}
                    placeholder={config.placeholder || 'Nhập nội dung...'}
                    className={`w-full bg-surface-elevated border text-text-main text-xs rounded-btn px-3.5 py-2.5 focus:outline-none focus:ring-1 transition-all ${
                      inputError
                        ? 'border-status-danger focus:ring-status-danger'
                        : 'border-surface-border focus:border-brand-primary focus:ring-brand-primary'
                    }`}
                  />
                  {inputError && (
                    <p className="text-[11px] text-status-danger mt-1.5 flex items-center gap-1">
                      <AppIcon name="AlertCircle" size={12} />
                      {inputError}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-3.5 border-t border-surface-border bg-surface-elevated/40 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => handleClose(config.isPrompt ? null : false)}
                className="px-4 py-2 rounded-btn text-xs font-semibold text-text-muted hover:text-text-main hover:bg-surface-elevated border border-surface-border transition-colors"
              >
                {config.cancelText || 'Hủy bỏ'}
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className={`px-4 py-2 rounded-btn text-xs font-semibold shadow transition-all flex items-center gap-1.5 ${variantStyles.btn}`}
              >
                {config.confirmText || 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};
