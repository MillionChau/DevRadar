import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { AppIcon } from '../../components/common/Icon';
import { useAuth } from '../../context/AuthContext';

export const Register: React.FC = () => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      setError('Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách bảo mật');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Đăng ký không thành công. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[480px] my-8 animate-in fade-in duration-200">
      <Card variant="elevated" padding="lg" className="flex flex-col gap-6 border-surface-border/80">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-full bg-surface-elevated border border-surface-border flex items-center justify-center text-brand-secondary shadow-inner">
            <AppIcon name="user" size={24} />
          </div>
          <h1 className="text-xl font-bold text-text-main">Tạo tài khoản DevRadar</h1>
          <p className="text-xs text-text-muted">
            Tham gia cộng đồng và phân tích kho mã nguồn GitHub tự động
          </p>
        </div>

        {/* Social Register */}
        <div className="flex flex-col gap-2.5">
          <Button variant="secondary" className="w-full justify-center gap-2" icon="github">
            Đăng ký nhanh với GitHub
          </Button>
          <Button variant="outline" className="w-full justify-center gap-2">
            <span className="font-bold text-red-500 font-mono text-sm">G</span>
            <span>Đăng ký với Google</span>
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-[1px] bg-surface-border" />
          <span className="text-[11px] text-text-subtle font-mono uppercase">hoặc điền thông tin</span>
          <div className="flex-1 h-[1px] bg-surface-border" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="p-3 bg-status-danger/10 border border-status-danger/30 rounded-btn text-xs text-status-danger flex items-center gap-2">
              <AppIcon name="alert" size={14} />
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Tên hiển thị (Display Name)"
            type="text"
            icon="user"
            placeholder="Nguyen Van A"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />

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
            type="password"
            icon="lock"
            placeholder="Tối thiểu 8 ký tự"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Input
            label="Xác nhận mật khẩu"
            type="password"
            icon="check"
            placeholder="Nhập lại mật khẩu"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-text-muted select-none pt-1">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded bg-surface-elevated border-surface-border text-brand-primary focus:ring-brand-primary"
            />
            <span>
              Tôi đồng ý với{' '}
              <a href="#" className="text-brand-secondary underline">Điều khoản dịch vụ</a>
              {' '}và{' '}
              <a href="#" className="text-brand-secondary underline">Chính sách bảo mật</a>
              {' '}của DevRadar.
            </span>
          </label>

          <Button type="submit" variant="primary" className="w-full mt-2" isLoading={loading}>
            Hoàn tất đăng ký
          </Button>
        </form>

        <div className="text-center text-xs text-text-muted pt-2 border-t border-surface-border">
          Đã có tài khoản?{' '}
          <Link to="/auth/login" className="text-brand-secondary font-semibold hover:underline">
            Đăng nhập ngay
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Register;
