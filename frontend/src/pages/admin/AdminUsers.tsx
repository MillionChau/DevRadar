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

const MOCK_USERS: ManagedUser[] = [
  {
    id: 'u-101',
    userName: 'alex_turner',
    displayName: 'Alex Turner',
    email: 'alex.turner@cloudpulse.io',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    reputationPoints: 1420,
    role: 'Member',
    isBanned: false,
    joinedDate: 'Jan 2026'
  },
  {
    id: 'u-102',
    userName: 'sarah_j',
    displayName: 'Sarah Jenkins',
    email: 'sarah.j@datadrive.com',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
    reputationPoints: 3450,
    role: 'Moderator',
    isBanned: false,
    joinedDate: 'Nov 2025'
  },
  {
    id: 'u-103',
    userName: 'chen_weiliang',
    displayName: 'Wei-Liang Chen',
    email: 'wlchen@neotech.tw',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces',
    reputationPoints: 2890,
    role: 'Member',
    isBanned: false,
    joinedDate: 'Dec 2025'
  },
  {
    id: 'u-104',
    userName: 'marcus_k',
    displayName: 'Marcus Kowalski',
    email: 'marcus.k@orbitmesh.io',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
    reputationPoints: 2180,
    role: 'Member',
    isBanned: false,
    joinedDate: 'Jan 2026'
  },
  {
    id: 'u-105',
    userName: 'spam_bot99',
    displayName: 'Crypto Promotion Bot',
    email: 'bot99@spamdomain.xyz',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
    reputationPoints: -15,
    role: 'Guest',
    isBanned: true,
    joinedDate: 'Mar 2026'
  }
];

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<ManagedUser[]>(MOCK_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | UserRole>('All');
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'All' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleToggleBan = (userId: string) => {
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, isBanned: !u.isBanned } : u))
    );
  };

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, role: newRole } : u))
    );
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
            {filteredUsers.map(u => (
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
                      onClick={() => handleToggleBan(u.id)}
                    >
                      {u.isBanned ? 'Unban' : 'Ban'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
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
