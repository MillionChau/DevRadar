import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import { AppIcon } from '../../components/common/Icon';
import MarkdownRenderer from '../../components/common/MarkdownRenderer';
import MarkdownEditorToolbar from '../../components/common/MarkdownEditorToolbar';
import { communityApi } from '../../api';
import { toast } from '../../context/ToastContext';

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
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleInsertMarkdown = (prefix: string, suffix = '', defaultPlaceholder = '') => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent((prev) => prev + prefix + defaultPlaceholder + suffix);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || defaultPlaceholder;
    const newContent = content.substring(0, start) + prefix + selectedText + suffix + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    }, 50);
  };

  React.useEffect(() => {
    if (!id) return;
    communityApi
      .getPostById(id)
      .then((data: any) => {
        if (data) {
          const lines = (data.content || '').split('\n').filter(Boolean);
          if (lines.length > 0) {
            setTitle(lines[0].replace(/^[#\s*]+/, ''));
            setContent(lines.slice(1).join('\n'));
          } else {
            setContent(data.content || '');
          }
          if (data.tags) {
            setTagsInput(typeof data.tags === 'string' ? data.tags : data.tags.join(', '));
          }
          if (data.techZoneId) {
            setTechZone(data.techZoneId);
          }
        }
      })
      .catch((err) => {
        console.warn('Could not load post to edit, using default:', err);
      });
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const fullContent = `# ${title.trim()}\n\n${content.trim()}`;

    if (id) {
      try {
        await communityApi.updatePost(id, {
          content: fullContent,
          techZoneId: techZone || undefined,
          tags: tagsInput,
        });
        toast.success('Đã lưu các thay đổi cho bài viết!', 'Chỉnh sửa bài');
      } catch (err: any) {
        console.warn('Could not update post on server:', err);
        toast.error(err?.message || 'Không thể lưu bài viết', 'Lỗi');
      }
    }

    setIsSaving(false);
    navigate(`/posts/${id || 'post-001'}`);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Top Action Bar (Matches SCR-09 wireframe) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            icon="arrowRight"
            className="rotate-180"
            onClick={() => navigate(-1)}
            tooltip="Quay lại trang chi tiết bài viết"
          >
            Hủy bỏ
          </Button>
          <h1 className="text-lg font-bold text-text-main">Chỉnh sửa Bài viết (SCR-09)</h1>
          <Badge variant="success" size="sm">ĐÃ XUẤT BẢN</Badge>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-text-subtle font-mono hidden sm:inline">
            Bản nháp tự động lưu lúc 13:25
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            tooltip="Hủy các thay đổi chưa lưu"
          >
            Hủy thay đổi
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon="check"
            isLoading={isSaving}
            onClick={handleSave}
            tooltip="Lưu và áp dụng các cập nhật cho bài viết"
          >
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

      {/* Markdown Editor & Live Preview Container */}
      <div className="flex flex-col gap-4 min-h-[560px]">
        {/* Editor Toolbar with View mode */}
        <div className="rounded-card overflow-hidden border border-surface-border bg-surface-card">
          <MarkdownEditorToolbar
            onInsert={handleInsertMarkdown}
            viewMode={viewMode}
            onChangeViewMode={setViewMode}
          />

          <div className={`grid gap-0 min-h-[480px] ${viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-surface-border' : 'grid-cols-1'}`}>
            {/* Editor Textarea */}
            {(viewMode === 'split' || viewMode === 'edit') && (
              <div className="flex flex-col h-full bg-surface-card">
                <div className="px-4 py-2 bg-surface-elevated/30 border-b border-surface-border/60 flex items-center justify-between text-[11px] text-text-subtle font-mono">
                  <span>NỘI DUNG SOẠN THẢO MARKDOWN</span>
                  <span>{content.length} ký tự</span>
                </div>
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full flex-1 min-h-[440px] p-4 bg-[#090D16] text-text-main font-mono text-xs leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  placeholder="Nhập nội dung markdown chuẩn..."
                />
              </div>
            )}

            {/* Live Preview */}
            {(viewMode === 'split' || viewMode === 'preview') && (
              <div className="flex flex-col h-full bg-[#0E1526]/60">
                <div className="px-4 py-2 bg-surface-elevated/30 border-b border-surface-border/60 flex items-center justify-between text-[11px] text-text-subtle font-mono">
                  <span className="flex items-center gap-1.5 text-brand-secondary">
                    <span className="w-2 h-2 rounded-full bg-status-success animate-pulse inline-block" />
                    XEM TRƯỚC BÀI SỬA (MARKDOWN PREVIEW)
                  </span>
                  <span className="text-status-success text-[11px] font-semibold">Tự động đồng bộ</span>
                </div>

                <div className="p-6 overflow-y-auto max-h-[600px] flex flex-col gap-4">
                  {title && (
                    <div className="pb-3 border-b border-surface-border/70">
                      <h1 className="text-xl md:text-2xl font-extrabold text-text-main leading-tight">
                        {title}
                      </h1>
                    </div>
                  )}

                  {content.trim() ? (
                    <MarkdownRenderer content={content} />
                  ) : (
                    <div className="py-16 text-center text-text-subtle text-xs italic">
                      Chưa có nội dung.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Markdown Cheatsheet Guide */}
        <div className="p-4 rounded-card bg-surface-elevated/30 border border-surface-border flex flex-col gap-2.5 text-xs">
          <div className="flex items-center gap-2 font-bold text-text-main">
            <AppIcon name="terminal" size={14} className="text-brand-secondary" />
            <span>Quy chuẩn định dạng Markdown DevRadar</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px] text-text-muted">
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-text-main">Định dạng chữ:</span>
              <code>**Chữ in đậm**</code>
              <code>*Chữ in nghiêng*</code>
              <code>~~Gạch ngang~~</code>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-text-main">Khối mã (Code Blocks):</span>
              <code>```cpp (C++)</code>
              <code>```csharp (C#)</code>
              <code>```python (Python)</code>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-text-main">Tiêu đề & Trích dẫn:</span>
              <code>## Mục chính</code>
              <code>### Mục phụ</code>
              <code>&gt; Trích dẫn</code>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-text-main">Thông báo GitHub Alerts:</span>
              <code>&gt; [!NOTE]</code>
              <code>&gt; [!TIP]</code>
              <code>&gt; [!WARNING]</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPost;
