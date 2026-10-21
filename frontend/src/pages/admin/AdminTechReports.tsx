import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { AppIcon } from '../../components/common/Icon';
import { analyticsApi } from '../../api';

interface TechReportItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content_markdown: string;
  category: 'TREND' | 'LANGUAGE' | 'FRAMEWORK' | 'DEVOPS' | string;
  tags?: string[];
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  views_count: number;
  likes_count: number;
  author_name: string;
  created_at: string;
  published_at?: string;
  metrics_snapshot?: any;
}

export const AdminTechReports: React.FC = () => {
  const [reports, setReports] = useState<TechReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [previewReport, setPreviewReport] = useState<TechReportItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<Partial<TechReportItem> | null>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);

  // AI Form state
  const [aiTopic, setAiTopic] = useState('');
  const [aiCategory, setAiCategory] = useState('TREND');
  const [aiTargetTech, setAiTargetTech] = useState('');
  const [aiStatus, setAiStatus] = useState('DRAFT');

  // Manual Form state
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    summary: '',
    category: 'TREND',
    tags: '',
    content_markdown: '',
    status: 'DRAFT',
  });

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await analyticsApi.getAdminReports({
        status: statusFilter === 'all' ? undefined : statusFilter,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        search: searchQuery.trim() || undefined,
        limit: 50,
      });
      const items = Array.isArray(res) ? res : res.items || [];
      setReports(items);
    } catch (err) {
      console.error('Failed to load admin tech reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter, categoryFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports();
  };

  const handleOpenAIModal = async () => {
    setIsAIModalOpen(true);
    try {
      const res = await analyticsApi.getAIReportSuggestions();
      setAiSuggestions(res.suggested_topics || []);
    } catch {
      setAiSuggestions([]);
    }
  };

  const handleGenerateAI = async () => {
    if (!aiTopic.trim()) {
      alert('Vui lòng nhập hoặc chọn một chủ đề phân tích');
      return;
    }
    setIsGeneratingAI(true);
    try {
      const res = await analyticsApi.generateAIReport({
        topic: aiTopic.trim(),
        category: aiCategory,
        target_tech: aiTargetTech.trim() || undefined,
        status: aiStatus,
        save_to_db: true,
        include_live_metrics: true,
      });
      alert(`Đã khởi tạo thành công báo cáo AI: "${res.data?.title || aiTopic}"`);
      setIsAIModalOpen(false);
      setAiTopic('');
      fetchReports();
    } catch (err: any) {
      alert(`Lỗi khi tạo báo cáo AI: ${err?.message || 'Không thể kết nối dịch vụ AI'}`);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handlePublish = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn duyệt xuất bản báo cáo này ra cộng đồng?')) return;
    try {
      await analyticsApi.publishAdminReport(id);
      fetchReports();
    } catch (err: any) {
      alert(`Lỗi: ${err?.message || 'Không thể xuất bản báo cáo'}`);
    }
  };

  const handleHide = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn ẩn báo cáo này khỏi giao diện người dùng?')) return;
    try {
      await analyticsApi.hideAdminReport(id);
      fetchReports();
    } catch (err: any) {
      alert(`Lỗi: ${err?.message || 'Không thể ẩn báo cáo'}`);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Xác nhận xóa vĩnh viễn báo cáo: "${title}"?`)) return;
    try {
      await analyticsApi.deleteAdminReport(id);
      fetchReports();
    } catch (err: any) {
      alert(`Lỗi: ${err?.message || 'Không thể xóa báo cáo'}`);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingReport(null);
    setFormData({
      title: '',
      slug: '',
      summary: '',
      category: 'TREND',
      tags: '',
      content_markdown: '# Tiêu đề báo cáo\n\n## 1. Giới thiệu tổng quan\nNội dung phân tích...',
      status: 'DRAFT',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEditModal = (rep: TechReportItem) => {
    setEditingReport(rep);
    setFormData({
      title: rep.title || '',
      slug: rep.slug || '',
      summary: rep.summary || '',
      category: rep.category || 'TREND',
      tags: Array.isArray(rep.tags) ? rep.tags.join(', ') : '',
      content_markdown: rep.content_markdown || '',
      status: rep.status || 'DRAFT',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content_markdown.trim()) {
      alert('Vui lòng điền đầy đủ tiêu đề và nội dung báo cáo.');
      return;
    }

    const payload = {
      title: formData.title.trim(),
      slug: formData.slug.trim() || undefined,
      summary: formData.summary.trim() || formData.title.trim(),
      category: formData.category,
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
      content_markdown: formData.content_markdown,
      status: formData.status,
    };

    try {
      if (editingReport && editingReport.id) {
        await analyticsApi.updateAdminReport(editingReport.id, payload);
        alert('Cập nhật báo cáo thành công!');
      } else {
        await analyticsApi.createAdminReport(payload);
        alert('Tạo mới báo cáo thành công!');
      }
      setIsEditModalOpen(false);
      fetchReports();
    } catch (err: any) {
      alert(`Lỗi khi lưu báo cáo: ${err?.message || 'Thao tác không thành công'}`);
    }
  };

  // Stats
  const totalCount = reports.length;
  const publishedCount = reports.filter((r) => r.status === 'PUBLISHED').length;
  const draftCount = reports.filter((r) => r.status === 'DRAFT').length;
  const archivedCount = reports.filter((r) => r.status === 'ARCHIVED').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-xl font-bold text-text-main flex items-center gap-2">
            <AppIcon name="fileText" size={22} className="text-brand-primary" />
            Quản lý Báo cáo Công nghệ (Tech Reports CMS)
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Biên tập tài liệu kỹ thuật chuyên sâu (Whitepapers), xuất bản báo cáo phân tích AI ra cộng đồng (UC-64 đến UC-68).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon="radar" onClick={handleOpenAIModal}>
            ✨ AI Sinh báo cáo
          </Button>
          <Button variant="primary" size="sm" icon="plus" onClick={handleOpenCreateModal}>
            Tạo báo cáo mới
          </Button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="elevated" padding="md" className="flex flex-col gap-1 border-surface-border/80">
          <span className="text-[11px] font-semibold text-text-subtle uppercase">Tổng báo cáo</span>
          <span className="text-2xl font-bold text-text-main font-mono">{totalCount}</span>
          <span className="text-[10px] text-text-muted">Kho tài liệu DevRadar</span>
        </Card>
        <Card variant="elevated" padding="md" className="flex flex-col gap-1 border-emerald-500/30 bg-emerald-500/5">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase">Đã xuất bản</span>
          <span className="text-2xl font-bold text-emerald-400 font-mono">{publishedCount}</span>
          <span className="text-[10px] text-emerald-400/70">Hiển thị công khai</span>
        </Card>
        <Card variant="elevated" padding="md" className="flex flex-col gap-1 border-amber-500/30 bg-amber-500/5">
          <span className="text-[11px] font-semibold text-amber-400 uppercase">Bản nháp (Draft)</span>
          <span className="text-2xl font-bold text-amber-400 font-mono">{draftCount}</span>
          <span className="text-[10px] text-amber-400/70">Chờ duyệt nội dung</span>
        </Card>
        <Card variant="elevated" padding="md" className="flex flex-col gap-1 border-surface-border/80">
          <span className="text-[11px] font-semibold text-text-subtle uppercase">Đã ẩn (Archived)</span>
          <span className="text-2xl font-bold text-text-muted font-mono">{archivedCount}</span>
          <span className="text-[10px] text-text-subtle">Lưu trữ nội bộ</span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-surface-card border border-surface-border p-3 rounded-card">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['all', 'PUBLISHED', 'DRAFT', 'ARCHIVED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-btn text-xs font-semibold transition-colors ${
                statusFilter === tab
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'bg-surface-elevated text-text-muted hover:text-text-main'
              }`}
            >
              {tab === 'all'
                ? 'Tất cả'
                : tab === 'PUBLISHED'
                ? 'Đã xuất bản'
                : tab === 'DRAFT'
                ? 'Bản nháp'
                : 'Đã ẩn'}
            </button>
          ))}
        </div>

        {/* Category & Search Form */}
        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-surface-elevated border border-surface-border text-text-main text-xs rounded-btn px-2.5 h-8 focus:outline-none"
          >
            <option value="all">Mọi chuyên mục</option>
            <option value="TREND">Xu hướng (TREND)</option>
            <option value="LANGUAGE">Ngôn ngữ (LANGUAGE)</option>
            <option value="FRAMEWORK">Framework (FRAMEWORK)</option>
            <option value="DEVOPS">DevOps & Cloud (DEVOPS)</option>
          </select>

          <form onSubmit={handleSearch} className="flex items-center gap-1">
            <input
              type="text"
              placeholder="Tìm theo tiêu đề..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface-elevated border border-surface-border text-text-main text-xs rounded-btn px-3 h-8 w-44 md:w-56 focus:outline-none focus:border-brand-primary"
            />
            <Button variant="ghost" size="sm" type="submit" icon="search">
              Tìm
            </Button>
          </form>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-surface-card border border-surface-border rounded-card overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-text-muted">Đang tải danh sách báo cáo công nghệ...</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-center px-4">
            <AppIcon name="fileText" size={32} className="text-text-subtle" />
            <p className="text-sm font-semibold text-text-main">Không tìm thấy báo cáo nào</p>
            <p className="text-xs text-text-muted max-w-sm">
              Bạn có thể bấm <strong>"AI Sinh báo cáo"</strong> để hệ thống tự động tổng hợp bài phân tích mới từ dữ liệu GitHub Crawler.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-text-muted">
              <thead className="bg-surface-elevated/70 text-text-subtle uppercase text-[10px] font-bold border-b border-surface-border">
                <tr>
                  <th className="py-3 px-4">Tiêu đề báo cáo</th>
                  <th className="py-3 px-3">Chuyên mục</th>
                  <th className="py-3 px-3">Trạng thái</th>
                  <th className="py-3 px-3">Tác giả</th>
                  <th className="py-3 px-3">Lượt đọc & Like</th>
                  <th className="py-3 px-3">Ngày tạo</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/60">
                {reports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="py-3 px-4 max-w-xs">
                      <p
                        onClick={() => setPreviewReport(rep)}
                        className="font-bold text-text-main hover:text-brand-secondary cursor-pointer truncate"
                        title={rep.title}
                      >
                        {rep.title}
                      </p>
                      <p className="text-[11px] text-text-subtle truncate mt-0.5" title={rep.summary}>
                        {rep.summary}
                      </p>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <Badge variant="tech" size="sm">
                        {rep.category}
                      </Badge>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      {rep.status === 'PUBLISHED' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Đã xuất bản
                        </span>
                      ) : rep.status === 'DRAFT' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Bản nháp
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-elevated text-text-subtle border border-surface-border">
                          <span className="w-1.5 h-1.5 rounded-full bg-text-subtle" />
                          Đã ẩn
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-medium text-text-main">{rep.author_name || 'AI Analyst'}</span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
                      <span>👁️ {rep.views_count || 0}</span>
                      <span className="ml-2.5">❤️ {rep.likes_count || 0}</span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap text-text-subtle text-[11px]">
                      {new Date(rep.created_at).toLocaleDateString('vi-VN')}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon="eye"
                          onClick={() => setPreviewReport(rep)}
                          title="Xem trước nội dung"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon="edit"
                          onClick={() => handleOpenEditModal(rep)}
                          title="Chỉnh sửa nội dung"
                        />
                        {rep.status !== 'PUBLISHED' ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handlePublish(rep.id)}
                            title="Duyệt xuất bản ra trang chủ"
                            className="text-[11px] h-7 px-2"
                          >
                            Duyệt
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleHide(rep.id)}
                            title="Ẩn bài viết khỏi cộng đồng"
                            className="text-[11px] h-7 px-2 text-amber-400"
                          >
                            Ẩn
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          icon="trash"
                          onClick={() => handleDelete(rep.id, rep.title)}
                          title="Xóa vĩnh viễn"
                          className="text-status-danger hover:bg-status-danger/10"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PREVIEW MODAL */}
      {previewReport && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewReport(null)}
          title={`Xem trước: ${previewReport.title}`}
          maxWidth="xl"
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <Badge variant="tech" size="sm">{previewReport.category}</Badge>
                <span className="text-xs text-text-subtle">
                  Tác giả: <strong>{previewReport.author_name}</strong>
                </span>
              </div>
              <span className="text-xs font-mono text-text-muted">
                👁️ {previewReport.views_count} lượt đọc • ❤️ {previewReport.likes_count} thích
              </span>
            </div>

            <div className="p-3 bg-surface-elevated/70 border border-surface-border rounded-btn text-xs text-text-main italic">
              <strong>Tóm tắt:</strong> {previewReport.summary}
            </div>

            <div className="prose prose-invert max-w-none text-xs text-text-main leading-relaxed whitespace-pre-wrap font-sans bg-surface-bg p-4 rounded-card border border-surface-border">
              {previewReport.content_markdown}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-surface-border">
              <span className="text-[11px] text-text-subtle">
                Trạng thái: <strong>{previewReport.status}</strong>
              </span>
              <div className="flex items-center gap-2">
                {previewReport.status !== 'PUBLISHED' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      handlePublish(previewReport.id);
                      setPreviewReport(null);
                    }}
                  >
                    Duyệt xuất bản ngay
                  </Button>
                )}
                <Button variant="secondary" size="sm" onClick={() => setPreviewReport(null)}>
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* CREATE / EDIT REPORT MODAL */}
      {isEditModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsEditModalOpen(false)}
          title={editingReport ? 'Chỉnh sửa Báo cáo Công nghệ' : 'Soạn thảo Báo cáo Công nghệ Mới'}
          maxWidth="xl"
        >
          <form onSubmit={handleSaveReport} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Tiêu đề báo cáo *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="VD: Báo cáo xu hướng công nghệ Go và Microservices 2026..."
                className="w-full bg-surface-elevated border border-surface-border rounded-btn px-3 py-2 text-xs text-text-main focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Chuyên mục</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-surface-elevated border border-surface-border rounded-btn px-3 py-2 text-xs text-text-main focus:outline-none"
                >
                  <option value="TREND">Xu hướng (TREND)</option>
                  <option value="LANGUAGE">Ngôn ngữ (LANGUAGE)</option>
                  <option value="FRAMEWORK">Framework (FRAMEWORK)</option>
                  <option value="DEVOPS">DevOps & Cloud (DEVOPS)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Trạng thái xuất bản</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-surface-elevated border border-surface-border rounded-btn px-3 py-2 text-xs text-text-main focus:outline-none"
                >
                  <option value="DRAFT">Lưu bản nháp (DRAFT)</option>
                  <option value="PUBLISHED">Xuất bản công khai (PUBLISHED)</option>
                  <option value="ARCHIVED">Lưu trữ ẩn (ARCHIVED)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Tóm tắt ngắn (Summary)</label>
              <textarea
                rows={2}
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Tóm tắt ngắn gọn mục tiêu và phát hiện chính..."
                className="w-full bg-surface-elevated border border-surface-border rounded-btn px-3 py-2 text-xs text-text-main focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Tags (cách nhau bởi dấu phẩy)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="golang, microservices, cloud-native"
                className="w-full bg-surface-elevated border border-surface-border rounded-btn px-3 py-2 text-xs text-text-main focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Nội dung báo cáo (Markdown) *</label>
              <textarea
                rows={10}
                required
                value={formData.content_markdown}
                onChange={(e) => setFormData({ ...formData, content_markdown: e.target.value })}
                placeholder="# Tiêu đề chính&#10;&#10;## 1. Giới thiệu..."
                className="w-full bg-surface-elevated border border-surface-border rounded-btn px-3 py-2 text-xs text-text-main font-mono focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-surface-border">
              <Button variant="secondary" size="sm" type="button" onClick={() => setIsEditModalOpen(false)}>
                Hủy bỏ
              </Button>
              <Button variant="primary" size="sm" type="submit">
                {editingReport ? 'Cập nhật báo cáo' : 'Lưu báo cáo'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* AI GENERATOR MODAL */}
      {isAIModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsAIModalOpen(false)}
          title="✨ Khởi tạo Báo cáo Phân tích Tự động bằng AI (LLM)"
          maxWidth="lg"
        >
          <div className="space-y-4">
            <p className="text-xs text-text-muted leading-relaxed">
              Hệ thống sử dụng mô hình LLM chuyên biệt kết hợp kho số liệu GitHub Crawler thời gian thực từ MongoDB để viết bài nghiên cứu chuyên sâu chuẩn Markdown.
            </p>

            {/* AI Hot Topics Pills */}
            {aiSuggestions.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-brand-secondary uppercase">
                  💡 Gợi ý chủ đề nổi bật từ dữ liệu:
                </span>
                <div className="flex flex-col gap-1.5">
                  {aiSuggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setAiTopic(sug.topic);
                        if (sug.category) setAiCategory(sug.category);
                        if (sug.target_tech) setAiTargetTech(sug.target_tech);
                      }}
                      className="text-left text-xs p-2 rounded-btn bg-surface-elevated hover:bg-brand-primary/10 border border-surface-border hover:border-brand-primary/40 transition-colors text-text-main truncate"
                    >
                      • {sug.topic}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Chủ đề phân tích (Topic / Prompt) *</label>
              <input
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="VD: Đánh giá độ trưởng thành và tương lai của Rust trong phát triển Backend..."
                className="w-full bg-surface-elevated border border-surface-border rounded-btn px-3 py-2 text-xs text-text-main focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Chuyên mục</label>
                <select
                  value={aiCategory}
                  onChange={(e) => setAiCategory(e.target.value)}
                  className="w-full bg-surface-elevated border border-surface-border rounded-btn px-3 py-2 text-xs text-text-main focus:outline-none"
                >
                  <option value="TREND">Xu hướng (TREND)</option>
                  <option value="LANGUAGE">Ngôn ngữ (LANGUAGE)</option>
                  <option value="FRAMEWORK">Framework (FRAMEWORK)</option>
                  <option value="DEVOPS">DevOps & Cloud (DEVOPS)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Công nghệ trọng tâm</label>
                <input
                  type="text"
                  value={aiTargetTech}
                  onChange={(e) => setAiTargetTech(e.target.value)}
                  placeholder="VD: Rust, Python, Docker..."
                  className="w-full bg-surface-elevated border border-surface-border rounded-btn px-3 py-2 text-xs text-text-main focus:outline-none focus:border-brand-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Trạng thái sau khi sinh</label>
              <select
                value={aiStatus}
                onChange={(e) => setAiStatus(e.target.value)}
                className="w-full bg-surface-elevated border border-surface-border rounded-btn px-3 py-2 text-xs text-text-main focus:outline-none"
              >
                <option value="DRAFT">Lưu bản nháp (DRAFT - Khuyến nghị để duyệt)</option>
                <option value="PUBLISHED">Xuất bản công khai ngay (PUBLISHED)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-surface-border">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                disabled={isGeneratingAI}
                onClick={() => setIsAIModalOpen(false)}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="button"
                disabled={isGeneratingAI}
                onClick={handleGenerateAI}
                icon={isGeneratingAI ? undefined : 'radar'}
              >
                {isGeneratingAI ? 'Đang phân tích & sinh bài...' : 'Bắt đầu sinh với AI'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminTechReports;
