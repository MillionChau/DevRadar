import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { RoleBadge, ReputationBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { AppIcon } from '../../components/common/Icon';
import { UserRole } from '../../types';

interface ManagedUser {
  id: string;
  userName: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  reputationPoints: number;
  role: UserRole;
  isBanned: boolean;
  joinedDate: string;
}

import { adminApi } from '../../api';
import { recordActivity } from '../../utils/activityLogger';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | UserRole>('All');
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  React.useEffect(() => {
    setIsLoading(true);
    adminApi
      .getUsers(1, 50, searchQuery)
      .then((data: any) => {
        const raw = Array.isArray(data) ? data : data?.items || data?.data || [];
        if (Array.isArray(raw)) {
          const live: ManagedUser[] = raw.map((u: any) => ({
            id: u.id,
            userName: u.userName || 'user',
            displayName: u.fullName || u.displayName || u.userName || 'DevRadar Member',
            email: u.email || 'user@devradar.io',
            avatarUrl: u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100',
            reputationPoints: u.reputationPoints ?? 1200,
            role: (Array.isArray(u.roles) && u.roles.length > 0 ? u.roles[0] : (u.role || 'Member')) as UserRole,
            isBanned: u.status === 2, // 2 = Locked/Banned
            joinedDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : 'Mới tham gia',
          }));
          setUsers(live);
        }
      })
      .catch((err) => {
        console.error('Could not load users from IdentityService:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [searchQuery]);

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'All' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleToggleBan = async (user: ManagedUser) => {
    const nextBanned = !user.isBanned;
    setUsers(prev =>
      prev.map(u => (u.id === user.id ? { ...u, isBanned: nextBanned } : u))
    );

    try {
      if (nextBanned) {
        await adminApi.lockUser(user.id);
      } else {
        await adminApi.unlockUser(user.id);
      }

      recordActivity({
        action: nextBanned ? 'USER_LOCK' : 'USER_UNLOCK',
        action_label: nextBanned ? `Khóa tài khoản thành viên @${user.userName}` : `Mở khóa tài khoản thành viên @${user.userName}`,
        category: 'SECURITY',
        target_type: 'USER',
        target_name: `@${user.userName} (${user.displayName || user.email})`,
        target_id: user.id,
        status: 'SUCCESS',
        details: { previous_state: user.isBanned, new_state: nextBanned, role: user.role }
      });
    } catch (err) {
      console.warn('Could not update user lock status on server:', err);
      setUsers(prev =>
        prev.map(u => (u.id === user.id ? { ...u, isBanned: user.isBanned } : u))
      );
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!confirm('Bạn có chắc chắn muốn xóa tài khoản người dùng này khỏi hệ thống?')) return;
    setUsers(prev => prev.filter(u => u.id !== userId));
    try {
      await adminApi.deleteUser(userId);
      recordActivity({
        action: 'USER_DELETE',
        action_label: `Xóa tài khoản người dùng @${targetUser?.userName || userId}`,
        category: 'SECURITY',
        target_type: 'USER',
        target_name: `@${targetUser?.userName || userId}`,
        target_id: userId,
        status: 'SUCCESS'
      });
    } catch (err) {
      console.warn('Could not delete user on server:', err);
    }
  };

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    const targetUser = users.find(u => u.id === userId);
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, role: newRole } : u))
    );
    recordActivity({
      action: 'USER_ROLE_CHANGE',
      action_label: `Thay đổi quyền người dùng @${targetUser?.userName || userId} sang ${newRole}`,
      category: 'SECURITY',
      target_type: 'USER',
      target_name: `@${targetUser?.userName || userId}`,
      target_id: userId,
      status: 'SUCCESS',
      details: { previous_role: targetUser?.role, new_role: newRole }
    });
    setIsEditModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
            <AppIcon name="Users" size={24} className="text-brand-primary" />
            User Management
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Manage member privileges, role assignments, reputation standing, and ban enforcements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon="Download">
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Input
            placeholder="Search by username, full name, or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            leftIcon="Search"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-text-muted whitespace-nowrap">Role Filter:</label>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as any)}
            className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-brand-primary"
          >
            <option value="All">All Roles</option>
            <option value="Member">Member</option>
            <option value="Moderator">Moderator</option>
            <option value="Admin">Admin</option>
            <option value="Guest">Guest</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <Card variant="surface" className="overflow-x-auto p-0 border border-surface-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-elevated/70 border-b border-surface-border text-text-muted text-xs uppercase font-semibold">
            <tr>
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Reputation</th>
              <th className="py-3 px-4">Joined</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border/60">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-text-muted">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs">Đang tải danh sách tài khoản từ cơ sở dữ liệu Identity...</span>
                  </div>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-text-muted">
                  <div className="flex flex-col items-center gap-2">
                    <AppIcon name="Users" size={32} className="text-text-subtle" />
                    <span className="text-sm font-medium text-text-main">Không tìm thấy tài khoản người dùng</span>
                    <span className="text-xs text-text-subtle">Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc vai trò.</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map(u => (
              <tr key={u.id} className="hover:bg-surface-elevated/40 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={u.avatarUrl}
                      alt={u.userName}
                      className="w-9 h-9 rounded-full border border-surface-border object-cover"
                    />
                    <div>
                      <div className="font-medium text-text-main">{u.displayName}</div>
                      <div className="text-xs text-text-subtle">@{u.userName} • {u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <RoleBadge role={u.role} />
                </td>
                <td className="py-3 px-4">
                  <ReputationBadge score={u.reputationPoints} />
                </td>
                <td className="py-3 px-4 text-text-muted text-xs">
                  {u.joinedDate}
                </td>
                <td className="py-3 px-4">
                  {u.isBanned ? (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-status-danger/10 text-status-danger font-semibold border border-status-danger/20">
                      <AppIcon name="Ban" size={12} /> Banned
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-status-success/10 text-status-success font-semibold border border-status-success/20">
                      <AppIcon name="CheckCircle" size={12} /> Active
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon="Shield"
                      onClick={() => {
                        setSelectedUser(u);
                        setIsEditModalOpen(true);
                      }}
                      title="Change Role"
                    >
                      Role
                    </Button>
                    <Button
                      variant={u.isBanned ? 'outline' : 'danger'}
                      size="sm"
                      icon={u.isBanned ? 'Unlock' : 'Ban'}
                      onClick={() => handleToggleBan(u)}
                    >
                      {u.isBanned ? 'Unban' : 'Ban'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon="Trash2"
                      className="text-status-danger hover:bg-status-danger/10"
                      onClick={() => handleDeleteUser(u.id)}
                      title="Delete User"
                    />
                  </div>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </Card>

      {/* Role Edit Modal */}
      {selectedUser && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Role for @${selectedUser.userName}`}
          footer={
            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-text-muted">
              Select the new security and moderation privilege tier for {selectedUser.displayName}.
            </p>
            <div className="grid grid-cols-1 gap-2">
              {(['Member', 'Moderator', 'Admin', 'Guest'] as UserRole[]).map(r => (
                <button
                  key={r}
                  onClick={() => handleRoleChange(selectedUser.id, r)}
                  className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                    selectedUser.role === r
                      ? 'bg-brand-primary/15 border-brand-primary text-brand-primary font-semibold'
                      : 'bg-surface-elevated border-surface-border text-text-main hover:border-brand-primary/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <RoleBadge role={r} />
                    <span className="text-sm capitalize">{r} Privileges</span>
                  </div>
                  {selectedUser.role === r && (
                    <AppIcon name="Check" size={16} className="text-brand-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminUsers;
