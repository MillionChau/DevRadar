import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { AppIcon } from '../../components/common/Icon';
import { TechZone } from '../../types';

import { communityApi, adminApi } from '../../api';
import { recordActivity } from '../../utils/activityLogger';

export const AdminTechZones: React.FC = () => {
  const [zones, setZones] = useState<TechZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<TechZone | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState('#2563eb');
  const [formIcon, setFormIcon] = useState('Code2');

  const fetchTechZones = () => {
    setIsLoading(true);
    communityApi
      .getTechZones()
      .then((items) => {
        if (Array.isArray(items)) {
          setZones(items);
        }
      })
      .catch((err) => {
        console.error('Could not load live techzones:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  React.useEffect(() => {
    fetchTechZones();
  }, []);

  const openCreateModal = () => {
    setEditingZone(null);
    setFormName('');
    setFormSlug('');
    setFormDescription('');
    setFormColor('#2563eb');
    setFormIcon('Code2');
    setIsModalOpen(true);
  };

  const openEditModal = (tz: TechZone) => {
    setEditingZone(tz);
    setFormName(tz.name);
    setFormSlug(tz.slug);
    setFormDescription(tz.description);
    setFormColor(tz.color || '#2563eb');
    setFormIcon(tz.icon || 'Code2');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSlug.trim()) return;

    if (editingZone) {
      setZones(prev =>
        prev.map(z =>
          z.id === editingZone.id
            ? {
                ...z,
                name: formName,
                slug: formSlug,
                description: formDescription,
                color: formColor,
                icon: formIcon
              }
            : z
        )
      );

      try {
        await adminApi.updateTechZone(editingZone.id, {
          name: formName,
          slug: formSlug,
          description: formDescription,
          colorCode: formColor,
        });
        recordActivity({
          action: 'UPDATE_TECHZONE',
          action_label: `Cập nhật thông tin danh mục TechZone: ${formName}`,
          category: 'CONTENT',
          target_type: 'TECHZONE',
          target_name: formName,
          target_id: editingZone.id,
          status: 'SUCCESS'
        });
        fetchTechZones();
      } catch (err) {
        console.warn('Could not update techzone on server:', err);
      }
    } else {
      try {
        await adminApi.createTechZone({
          name: formName,
          slug: formSlug,
          description: formDescription,
          colorCode: formColor,
        });
        recordActivity({
          action: 'CREATE_TECHZONE',
          action_label: `Tạo mới chuyên mục công nghệ TechZone: ${formName}`,
          category: 'CONTENT',
          target_type: 'TECHZONE',
          target_name: formName,
          status: 'SUCCESS'
        });
        fetchTechZones();
      } catch (err) {
        console.warn('Could not create techzone on server:', err);
      }
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    const targetZone = zones.find(z => z.id === id);
    if (confirm('Bạn có chắc chắn muốn xóa danh mục TechZone này?')) {
      setZones(prev => prev.filter(z => z.id !== id));
      try {
        await adminApi.deleteTechZone(id);
        recordActivity({
          action: 'DELETE_TECHZONE',
          action_label: `Xóa danh mục TechZone: ${targetZone?.name || id}`,
          category: 'CONTENT',
          target_type: 'TECHZONE',
          target_name: targetZone?.name || id,
          target_id: id,
          status: 'SUCCESS'
        });
        fetchTechZones();
      } catch (err) {
        console.warn('Could not delete techzone on server:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-default">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <AppIcon name="Grid" size={24} className="text-primary-blue" />
            TechZones Management
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Configure technical topic clusters, theme colors, branding icons, and community categorizations.
          </p>
        </div>
        <Button variant="primary" icon="Plus" onClick={openCreateModal}>
          Create TechZone
        </Button>
      </div>

      {/* Grid of zones */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-text-muted">Đang tải danh sách TechZone từ cơ sở dữ liệu Community...</span>
        </div>
      ) : zones.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2 border border-dashed border-surface-border rounded-xl">
          <AppIcon name="Grid" size={32} className="text-text-subtle" />
          <span className="text-sm font-semibold text-text-main">Chưa có TechZone nào</span>
          <span className="text-xs text-text-muted">Nhấn nút "Create TechZone" để tạo chuyên mục công nghệ đầu tiên.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map(tz => (
          <Card key={tz.id} variant="surface" className="flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center border"
                  style={{
                    backgroundColor: `${tz.color || '#2563eb'}15`,
                    borderColor: `${tz.color || '#2563eb'}40`,
                    color: tz.color || '#2563eb'
                  }}
                >
                  <AppIcon name={(tz.icon as any) || 'Code2'} size={20} />
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon="Edit2"
                    onClick={() => openEditModal(tz)}
                    title="Edit TechZone"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon="Trash2"
                    className="text-accent-danger hover:bg-accent-danger/10"
                    onClick={() => handleDelete(tz.id)}
                    title="Delete TechZone"
                  />
                </div>
              </div>

              <div>
                <h3 className="font-bold text-text-primary text-base flex items-center gap-2">
                  {tz.name}
                </h3>
                <span className="text-xs font-mono text-text-tertiary">/zones/{tz.slug}</span>
              </div>

              <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed">
                {tz.description}
              </p>
            </div>

            <div className="pt-4 border-t border-border-default/60 flex items-center justify-between text-xs text-text-tertiary mt-3">
              <span>{tz.postCount} posts</span>
              <span>{tz.followerCount.toLocaleString()} members</span>
            </div>
          </Card>
        ))}
      </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingZone ? `Edit TechZone: ${editingZone.name}` : 'Create New TechZone'}
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {editingZone ? 'Save Changes' : 'Create Zone'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="TechZone Name"
            placeholder="e.g. Distributed Databases"
            value={formName}
            onChange={e => setFormName(e.target.value)}
            required
          />
          <Input
            label="Slug (URL identifier)"
            placeholder="e.g. distributed-databases"
            value={formSlug}
            onChange={e => setFormSlug(e.target.value)}
            required
          />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Description
            </label>
            <textarea
              className="w-full bg-surface-card border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary-blue resize-none h-24"
              placeholder="Explain the scope and technical focus of this zone..."
              value={formDescription}
              onChange={e => setFormDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Brand Accent Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formColor}
                  onChange={e => setFormColor(e.target.value)}
                  className="w-10 h-10 rounded border border-border-default cursor-pointer bg-transparent"
                />
                <span className="font-mono text-xs text-text-secondary">{formColor}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Morphicon / Lucide Icon
              </label>
              <select
                value={formIcon}
                onChange={e => setFormIcon(e.target.value)}
                className="w-full bg-surface-card border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-blue"
              >
                <option value="Cpu">Cpu</option>
                <option value="Layers">Layers</option>
                <option value="Terminal">Terminal</option>
                <option value="Database">Database</option>
                <option value="Sparkles">Sparkles</option>
                <option value="Code2">Code2</option>
                <option value="Boxes">Boxes</option>
                <option value="Network">Network</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
