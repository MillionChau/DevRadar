import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import Button from '../common/Button';
import { Input } from '../common/Input';
import { AppIcon } from '../common/Icon';
import { User } from '../../types';
import { authApi } from '../../api';
import { toast } from '../../context/ToastContext';
import { getSafeAvatarUrl } from '../../utils/avatarHelper';

export interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onProfileUpdated?: (updatedUser: Partial<User>) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onProfileUpdated,
}) => {
  // Parse existing names
  const initialFullName = user.fullName || user.displayName || '';
  const nameParts = initialFullName.trim().split(' ');
  const initialFirstName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : initialFullName;
  const initialLastName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : '';

  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [bio, setBio] = useState(user.bio || '');
  const [headline, setHeadline] = useState(user.headline || 'Thành viên DevRadar Community');
  const [githubUrl, setGithubUrl] = useState(user.githubProfileUrl || `https://github.com/${user.userName || ''}`);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state when user prop changes or modal opens
  useEffect(() => {
    if (isOpen && user) {
      const full = user.fullName || user.displayName || '';
      const parts = full.trim().split(' ');
      setFirstName(parts.length > 1 ? parts[parts.length - 1] : full);
      setLastName(parts.length > 1 ? parts.slice(0, -1).join(' ') : '');
      setBio(user.bio || '');
      setHeadline(user.headline || 'Thành viên DevRadar Community');
      setGithubUrl(user.githubProfileUrl || `https://github.com/${user.userName || ''}`);
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [isOpen, user]);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dung lượng ảnh đại diện không được vượt quá 5MB.');
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const uploadedUrl = await authApi.uploadAvatar(file);
      setAvatarUrl(uploadedUrl);
      toast.success('Tải ảnh đại diện lên MinIO S3 thành công!');
    } catch (err: any) {
      toast.error(err?.message || 'Không thể tải ảnh đại diện lên MinIO.');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.id) return;

    try {
      setIsSubmitting(true);

      const computedFullName = [lastName.trim(), firstName.trim()].filter(Boolean).join(' ');
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        address: address.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
        bio: bio.trim(),
        headline: headline.trim(),
        githubProfileUrl: githubUrl.trim(),
      };

      // Gọi API cập nhật thông tin người dùng trong IdentityService
      await authApi.updateProfile(user.id, payload);

      const updatedFields: Partial<User> = {
        displayName: computedFullName || user.displayName,
        fullName: computedFullName || user.fullName,
        avatarUrl: avatarUrl || user.avatarUrl,
        bio: bio.trim(),
        headline: headline.trim(),
        githubProfileUrl: githubUrl.trim(),
      };

      onProfileUpdated?.(updatedFields);
      toast.success('Cập nhật hồ sơ cá nhân thành công!');
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể cập nhật hồ sơ. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chỉnh sửa hồ sơ cá nhân"
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            icon="check"
          >
            Lưu thay đổi
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 py-1">
        {/* Avatar Section */}
        <div className="flex items-center gap-5 p-4 rounded-xl bg-surface-elevated/40 border border-surface-border">
          <div className="relative shrink-0 group">
            <img
              src={getSafeAvatarUrl(avatarUrl, user.displayName || user.userName, user.role)}
              alt={user.displayName || user.userName}
              className="w-20 h-20 rounded-full object-cover border-2 border-brand-primary/40 shadow-md bg-surface-card"
            />
            {isUploadingAvatar && (
              <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <h4 className="text-sm font-bold text-text-main">Ảnh đại diện</h4>
            <p className="text-xs text-text-muted">
              Định dạng hỗ trợ JPG, PNG, WEBP hoặc GIF (Tối đa 5MB). Ảnh được nén tự động sang WebP lưu tại MinIO S3.
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon="camera"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
              >
                {isUploadingAvatar ? 'Đang tải lên...' : 'Tải ảnh mới lên'}
              </Button>
              <input
                type="file"
                ref={avatarInputRef}
                onChange={handleAvatarFileChange}
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Họ & tên đệm"
            placeholder="Ví dụ: Châu"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <Input
            label="Tên"
            placeholder="Ví dụ: Millions"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Tên người dùng"
            value={`@${user.userName || ''}`}
            disabled
            helperText="Username là định danh cố định không thể chỉnh sửa"
          />
          <Input
            label="Địa chỉ Email"
            value={user.email || ''}
            disabled
            helperText="Email dùng để đăng nhập và nhận thông báo"
          />
        </div>

        {/* Professional Details */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-muted select-none">
            Chức danh / Tiêu đề nghề nghiệp
          </label>
          <Input
            placeholder="Ví dụ: Principal Architect, Senior Frontend Engineer..."
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-muted select-none">
            Giới thiệu bản thân (Bio)
          </label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Chia sẻ một chút về kinh nghiệm, định hướng công nghệ và sở thích của bạn..."
            className="w-full bg-surface-elevated border border-surface-border text-text-main text-xs sm:text-sm rounded-btn p-3 transition-colors duration-150 placeholder:text-text-subtle focus:outline-none focus:ring-1 focus:ring-brand-primary"
          />
        </div>

        {/* Contact & Social Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Số điện thoại"
            placeholder="0987654321"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            icon="phone"
          />
          <Input
            label="Khu vực / Nơi làm việc"
            placeholder="Hồ Chí Minh, Việt Nam"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            icon="map-pin"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-muted select-none">
            Đường dẫn GitHub cá nhân
          </label>
          <Input
            placeholder="https://github.com/username"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            icon="github"
          />
        </div>
      </form>
    </Modal>
  );
};

export default EditProfileModal;
