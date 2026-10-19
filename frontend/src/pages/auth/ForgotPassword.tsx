import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { AppIcon } from '../../components/common/Icon';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('verify');
    }, 600);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 600);
  };

  return (
    <div className="w-full max-w-[480px] my-8 animate-in fade-in duration-200">
      <Card variant="elevated" padding="lg" className="flex flex-col gap-6 border-surface-border/80">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-full bg-surface-elevated border border-surface-border flex items-center justify-center text-brand-secondary shadow-inner">
            <AppIcon name="lock" size={24} />
          </div>
          <h1 className="text-xl font-bold text-text-main">Khôi phục mật khẩu</h1>
          <p className="text-xs text-text-muted">
            {step === 'request'
              ? 'Nhập email đã đăng ký để nhận mã OTP khôi phục tài khoản'
              : `Nhập mã OTP 6 số đã được gửi đến ${email}`}
          </p>
        </div>

        {success ? (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="w-12 h-12 rounded-full bg-status-success/20 text-status-success flex items-center justify-center">
              <AppIcon name="check" size={24} />
            </div>
            <h3 className="text-base font-bold text-text-main">Đổi mật khẩu thành công!</h3>
            <p className="text-xs text-text-muted">
              Mật khẩu mới đã được cập nhật. Bạn có thể đăng nhập ngay bây giờ.
            </p>
            <Link to="/auth/login" className="w-full">
              <Button variant="primary" className="w-full">
                Quay lại Đăng nhập
              </Button>
            </Link>
          </div>
        ) : step === 'request' ? (
          <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
            <Input
              label="Địa chỉ Email"
              type="email"
              icon="mail"
              placeholder="developer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" variant="primary" className="w-full mt-2" isLoading={loading}>
              Gửi mã xác thực OTP
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
            <Input
              label="Mã xác thực OTP (6 chữ số)"
              type="text"
              icon="shield"
              placeholder="123456"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="font-mono text-center tracking-widest text-base"
              required
            />
            <Input
              label="Mật khẩu mới"
              type="password"
              icon="lock"
              placeholder="Tối thiểu 8 ký tự"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <Button type="submit" variant="primary" className="w-full mt-2" isLoading={loading}>
              Xác nhận & Đổi mật khẩu
            </Button>
            <button
              type="button"
              onClick={() => setStep('request')}
              className="text-xs text-text-muted hover:text-text-main text-center"
            >
              Gửi lại mã OTP
            </button>
          </form>
        )}

        <div className="text-center text-xs text-text-muted pt-2 border-t border-surface-border">
          <Link to="/auth/login" className="text-brand-secondary font-semibold hover:underline inline-flex items-center gap-1">
            <AppIcon name="arrowRight" size={12} className="rotate-180" />
            <span>Quay lại trang Đăng nhập</span>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default ForgotPassword;
