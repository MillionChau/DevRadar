import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { AppIcon } from '../../components/common/Icon';
import { useAuth } from '../../context/AuthContext';
import { recordActivity } from '../../utils/activityLogger';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('chautantan@devradar.io');
  const [password, setPassword] = useState('Password123!@#');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';

  const handleQuickFill = (accEmail: string) => {
    setEmail(accEmail);
    setPassword('Password123!@#');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const ok = await login(email, password);
      if (ok) {
        // Ghi nhận sự kiện đăng nhập thành công vào Audit Log
        recordActivity({
          action: 'AUTH_LOGIN',
          action_label: `Đăng nhập hệ thống thành công (${email})`,
          category: 'AUTH',
          target_type: 'AUTH',
          target_name: `Tài khoản: ${email}`,
          status: 'SUCCESS',
          customUser: {
            username: email.split('@')[0],
            displayName: email.split('@')[0],
            role: email.toLowerCase().includes('admin') ? 'Admin' : (email.toLowerCase().includes('mod') ? 'Moderator' : 'Member')
          }
        });
        navigate(from, { replace: true });
      } else {
        setError('Email hoặc mật khẩu không chính xác (Mã 401)');
        recordActivity({
          action: 'AUTH_LOGIN_FAILED',
          action_label: `Đăng nhập thất bại cho tài khoản ${email}`,
          category: 'SECURITY',
          target_type: 'AUTH',
          target_name: `Tài khoản: ${email}`,
          status: 'FAILED',
          details: { reason: 'Sai mật khẩu hoặc tài khoản chưa kích hoạt' },
          customUser: {
            username: email.split('@')[0],
            role: 'Guest'
          }
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Email hoặc mật khẩu không chính xác (Mã 401)');
      recordActivity({
        action: 'AUTH_LOGIN_FAILED',
        action_label: `Đăng nhập thất bại (Ngoại lệ: ${err?.message || '401 Unauthorized'})`,
        category: 'SECURITY',
        target_type: 'AUTH',
        target_name: `Tài khoản: ${email}`,
        status: 'FAILED',
        details: { reason: err?.message || 'Lỗi kết nối hoặc xác thực' },
        customUser: {
          username: email.split('@')[0],
          role: 'Guest'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[480px] my-8 animate-in fade-in duration-200">
      <Card variant="elevated" padding="lg" className="flex flex-col gap-6 border-surface-border/80">
        {/* Top Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-full bg-surface-elevated border border-surface-border flex items-center justify-center text-brand-secondary shadow-inner">
            <AppIcon name="lock" size={24} />
          </div>
          <h1 className="text-xl font-bold text-text-main">Đăng nhập DevRadar</h1>
          <p className="text-xs text-text-muted">
            Truy cập nền tảng mạng xã hội và phân tích năng lực GitHub
          </p>
        </div>

        {/* Quick Fill Test Accounts */}
        <div className="p-3 bg-surface-elevated/80 border border-surface-border rounded-btn flex flex-col gap-2">
          <span className="text-[11px] font-semibold text-text-subtle uppercase">Đăng nhập thử nghiệm theo vai trò (RBAC):</span>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleQuickFill('admin@devradar.io')}
              className="px-2.5 py-1 text-[11px] bg-status-danger/10 text-status-danger hover:bg-status-danger/20 rounded border border-status-danger/30 transition-colors font-medium"
            >
              🛡️ Admin (admin)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('moderator@devradar.io')}
              className="px-2.5 py-1 text-[11px] bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded border border-amber-500/30 transition-colors font-medium"
            >
              ⚖️ Moderator (moderator)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('chautantan@devradar.io')}
              className="px-2.5 py-1 text-[11px] bg-brand-primary/10 text-brand-secondary hover:bg-brand-primary/20 rounded border border-brand-primary/30 transition-colors font-medium"
            >
              👤 Member (chautantan)
            </button>
          </div>
        </div>

        {/* Social Login Buttons */}
        <div className="flex flex-col gap-2.5">
          <Button variant="secondary" className="w-full justify-center gap-2" icon="github">
            Đăng nhập với GitHub
          </Button>
          <Button variant="outline" className="w-full justify-center gap-2">
            <span className="font-bold text-red-500 font-mono text-sm">G</span>
            <span>Đăng nhập với Google</span>
          </Button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-[1px] bg-surface-border" />
          <span className="text-[11px] text-text-subtle font-mono uppercase">hoặc email</span>
          <div className="flex-1 h-[1px] bg-surface-border" />
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="p-3 bg-status-danger/10 border border-status-danger/30 rounded-btn text-xs text-status-danger flex items-center gap-2">
              <AppIcon name="alert" size={14} />
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Địa chỉ Email"
            type="email"
            icon="mail"
            placeholder="developer@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Mật khẩu"
            type={showPassword ? 'text' : 'password'}
            icon="lock"
            iconRight={showPassword ? 'eyeOff' : 'eye'}
            onRightIconClick={() => setShowPassword(!showPassword)}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-text-muted hover:text-text-main">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded bg-surface-elevated border-surface-border text-brand-primary focus:ring-brand-primary"
              />
              <span>Ghi nhớ đăng nhập</span>
            </label>
            <Link to="/auth/forgot-password" className="text-brand-secondary hover:underline font-medium">
              Quên mật khẩu?
            </Link>
          </div>

          <Button type="submit" variant="primary" className="w-full mt-2" isLoading={loading}>
            Đăng nhập hệ thống
          </Button>
        </form>

        {/* Bottom Link to Register */}
        <div className="text-center text-xs text-text-muted pt-2 border-t border-surface-border">
          Chưa có tài khoản?{' '}
          <Link to="/auth/register" className="text-brand-secondary font-semibold hover:underline">
            Tạo tài khoản mới
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Login;
