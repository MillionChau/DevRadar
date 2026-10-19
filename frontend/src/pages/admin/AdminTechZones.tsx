import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { AppIcon } from '../../components/common/Icon';
import { TechZone } from '../../types';

const INITIAL_TECH_ZONES: TechZone[] = [
  {
    id: 'tz-rust',
    name: 'Rust Ecosystem',
    slug: 'rust',
    description: 'High-performance systems programming, memory safety, async runtimes, and WebAssembly.',
    icon: 'Cpu',
    color: '#f97316',
    postCount: 1420,
    followerCount: 8900
  },
  {
    id: 'tz-dotnet',
    name: '.NET & C#',
    slug: 'dotnet',
    description: 'Enterprise backend, high-throughput web APIs, ASP.NET Core, Native AOT, and cloud-native services.',
    icon: 'Layers',
    color: '#8b5cf6',
    postCount: 980,
    followerCount: 6400
  },
  {
    id: 'tz-k8s',
    name: 'DevOps & Cloud Native',
    slug: 'devops',
    description: 'Kubernetes, eBPF, service meshes, Terraform, GitOps, and platform engineering.',
    icon: 'Terminal',
    color: '#0ea5e9',
    postCount: 2310,
    followerCount: 12500
  },
  {
    id: 'tz-ai',
    name: 'AI & Machine Learning',
    slug: 'ai-ml',
    description: 'LLM agents, vector embeddings, CUDA acceleration, PyTorch, and on-prem inference engines.',
    icon: 'Sparkles',
    color: '#ec4899',
    postCount: 3100,
    followerCount: 18200
  },
  {
    id: 'tz-database',
    name: 'Databases & Distributed Systems',
    slug: 'databases',
    description: 'PostgreSQL internals, distributed consensus, Raft, CockroachDB, and Redis clusters.',
    icon: 'Database',
    color: '#10b981',
    postCount: 1640,
    followerCount: 9200
  }
];

export const AdminTechZones: React.FC = () => {
  const [zones, setZones] = useState<TechZone[]>(INITIAL_TECH_ZONES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<TechZone | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState('#2563eb');
  const [formIcon, setFormIcon] = useState('Code2');

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

  const handleSave = (e: React.FormEvent) => {
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
    } else {
      const newZone: TechZone = {
        id: `tz-${Date.now()}`,
        name: formName,
        slug: formSlug,
        description: formDescription,
        color: formColor,
        icon: formIcon,
        postCount: 0,
        followerCount: 0
      };
      setZones(prev => [newZone, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this TechZone?')) {
      setZones(prev => prev.filter(z => z.id !== id));
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
