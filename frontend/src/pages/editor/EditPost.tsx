import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import { AppIcon } from '../../components/common/Icon';

export const EditPost: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [title, setTitle] = useState('Kiến trúc Microservices với .NET 10, YARP Reverse Proxy & PostgreSQL');
  const [techZone, setTechZone] = useState('dotnet');
  const [tagsInput, setTagsInput] = useState('dotnet10, microservices, yarp, postgres');
  const [content, setContent] = useState(`## Giới thiệu giải pháp

Bài viết trình bày chi tiết cách thiết kế hệ thống **DevRadar** sử dụng kiến trúc Microservices phân tán kết nối qua YARP Gateway và PostgreSQL.

\`\`\`csharp
app.MapReverseProxy(proxyPipeline => {
    proxyPipeline.UseRateLimiter();
    proxyPipeline.UseTokenRotation();
});
\`\`\`
`);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      navigate(`/posts/${id || 'post-001'}`);
    }, 600);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Top Action Bar (Matches SCR-09 wireframe) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon="arrowRight" className="rotate-180" onClick={() => navigate(-1)}>
            Hủy bỏ
          </Button>
          <h1 className="text-lg font-bold text-text-main">Chỉnh sửa Bài viết (SCR-09)</h1>
          <Badge variant="success" size="sm">ĐÃ XUẤT BẢN</Badge>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-text-subtle font-mono hidden sm:inline">
            Bản nháp tự động lưu lúc 13:25
          </span>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            Hủy thay đổi
          </Button>
          <Button variant="primary" size="sm" icon="check" isLoading={isSaving} onClick={handleSave}>
            Lưu thay đổi ✓
          </Button>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Input
            label="Tiêu đề bài viết"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-base font-semibold"
          />
        </div>

        <div className="flex gap-2">
          <div className="w-1/2 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted">TechZone</label>
            <select
              value={techZone}
              onChange={(e) => setTechZone(e.target.value)}
              className="w-full bg-surface-elevated border border-surface-border text-text-main text-xs rounded-btn px-3 h-10 focus:outline-none focus:border-brand-primary"
            >
              <option value="dotnet">.NET Core</option>
              <option value="react">React & UI</option>
              <option value="microservices">Microservices</option>
              <option value="crawler">GitHub Crawler</option>
            </select>
          </div>

          <div className="w-1/2">
            <Input
              label="Thẻ Tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="text-xs font-mono"
            />
          </div>
        </div>
      </div>

      {/* Split Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[500px]">
        <Card variant="default" padding="none" className="flex flex-col h-full overflow-hidden">
          <div className="px-4 py-2.5 bg-surface-elevated/40 border-b border-surface-border flex items-center justify-between text-xs text-text-subtle font-mono">
            <span>NỘI DUNG SOẠN THẢO</span>
            <span>Markdown</span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full flex-1 p-4 bg-surface-card text-text-main font-mono text-xs leading-relaxed resize-none focus:outline-none"
          />
        </Card>

        <Card variant="default" padding="none" className="flex flex-col h-full overflow-hidden bg-surface-elevated/20">
          <div className="px-4 py-2.5 bg-surface-elevated/40 border-b border-surface-border flex items-center justify-between text-xs text-text-subtle font-mono">
            <span>XEM TRƯỚC BÀI SỬA</span>
            <span className="text-status-success font-semibold">Tự động đồng bộ</span>
          </div>
          <div className="p-6 overflow-y-auto prose prose-invert text-xs text-text-main leading-relaxed">
            <h1 className="text-lg font-bold text-text-main mb-3">{title}</h1>
            <div className="whitespace-pre-wrap">{content}</div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EditPost;
