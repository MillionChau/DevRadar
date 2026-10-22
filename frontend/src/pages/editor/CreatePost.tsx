import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input, { Textarea } from '../../components/common/Input';
import { AppIcon } from '../../components/common/Icon';
import MarkdownRenderer from '../../components/common/MarkdownRenderer';
import MarkdownEditorToolbar from '../../components/common/MarkdownEditorToolbar';
import { communityApi } from '../../api';
import { TechZone } from '../../types';
import { toast } from '../../context/ToastContext';

export const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [techZone, setTechZone] = useState('');
  const [techZoneList, setTechZoneList] = useState<TechZone[]>([]);
  const [tagsInput, setTagsInput] = useState('dotnet10, microservices');
  const [content, setContent] = useState(`## Giới thiệu giải pháp

Bài viết trình bày chi tiết cách thiết kế hệ thống **DevRadar** sử dụng kiến trúc Microservices phân tán.

\`\`\`csharp
public void ConfigureServices(IServiceCollection services)
{
    services.AddReverseProxy()
            .LoadFromConfig(Configuration.GetSection("ReverseProxy"));
}
\`\`\`

### Các điểm mấu chốt:
1. Xác thực tập trung với JWT Token Rotation.
2. Kiểm duyệt tự động qua AI Toxicity.
`);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiWarning, setAiWarning] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
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

  useEffect(() => {
    communityApi
      .getTechZones()
      .then((zones) => {
        if (zones && zones.length > 0) {
          setTechZoneList(zones);
          setTechZone(zones[0].id);
        }
      })
      .catch((err) => {
        console.warn('Could not load dynamic techzones, fallbacking:', err);
      });
  }, []);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Vui lòng nhập tiêu đề bài viết');
      return;
    }
    if (!content.trim()) {
      setErrorMessage('Vui lòng nhập nội dung bài viết');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setAiWarning(null);

    const fullContent = `# ${title.trim()}\n\n${content.trim()}`;

    try {
      await communityApi.createPost({
        content: fullContent,
        techZoneId: techZone || undefined,
        tags: tagsInput,
      });

      toast.success('Đã xuất bản bài viết thành công!', 'Cộng đồng DevRadar');
      navigate('/');
    } catch (err: any) {
      console.warn('Create post error from API Gateway / QualityService:', err);
      const msg = err?.message || err?.data?.message || 'Có lỗi xảy ra khi đăng bài.';

      if (msg.toLowerCase().includes('toxic') || msg.toLowerCase().includes('kiểm duyệt') || msg.toLowerCase().includes('non-it')) {
        setAiWarning(`Hệ thống QualityService phát hiện nội dung có thể vi phạm tiêu chuẩn cộng đồng: "${msg}". Vui lòng điều chỉnh từ ngữ.`);
        toast.warning(msg, 'Cảnh báo kiểm duyệt AI');
      } else {
        setErrorMessage(msg);
        toast.error(msg, 'Lỗi đăng bài');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const parsedTags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            icon="arrowRight"
            className="rotate-180"
            onClick={() => navigate(-1)}
            tooltip="Quay lại trang trước"
          >
            Quay lại
          </Button>
          <h1 className="text-lg font-bold text-text-main">Soạn thảo Bài viết mới (SCR-08)</h1>
          <Badge variant="reputation" size="sm">Bản nháp</Badge>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAiWarning(aiWarning ? null : 'Cảnh báo mẫu: Nội dung có thể vi phạm tiêu chuẩn cộng đồng.')}
            tooltip="Bật/tắt kiểm tra mô phỏng cảnh báo AI Toxicity"
          >
            {aiWarning ? 'Tắt thử nghiệm AI' : 'Thử nghiệm cảnh báo AI'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon="send"
            isLoading={isSubmitting}
            onClick={handlePublish}
            tooltip="Xuất bản bài viết công nghệ lên cộng đồng DevRadar"
          >
            Xuất bản bài viết
          </Button>
        </div>
      </div>

      {/* AI Toxicity Alert Banner */}
      {aiWarning && (
        <div className="p-4 bg-status-danger/10 border border-status-danger/30 rounded-card flex items-start gap-3 text-xs">
          <div className="text-status-danger mt-0.5">
            <AppIcon name="alert" size={18} />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-status-danger text-sm mb-1">
              Cảnh báo Kiểm duyệt AI QualityService
            </h4>
            <p className="text-text-muted leading-relaxed">
              {aiWarning}
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-status-danger/10 border border-status-danger/30 rounded-btn text-xs text-status-danger flex items-center gap-2">
          <AppIcon name="alert" size={14} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Title & Metadata Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Input
            placeholder="Tiêu đề bài viết kỹ thuật..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-base font-semibold"
            required
          />
        </div>

        <div className="flex gap-2">
          <select
            value={techZone}
            onChange={(e) => setTechZone(e.target.value)}
            className="w-1/2 bg-surface-elevated border border-surface-border text-text-main text-xs rounded-btn px-3 h-10 focus:outline-none focus:border-brand-primary"
          >
            {techZoneList.length > 0 ? (
              techZoneList.map((tz) => (
                <option key={tz.id} value={tz.id}>
                  {tz.name}
                </option>
              ))
            ) : (
              <>
                <option value="dotnet">.NET Core & C#</option>
                <option value="python-ai">Python & AI / Data</option>
                <option value="typescript-react">TypeScript & React</option>
                <option value="golang">Go & Cloud Native</option>
                <option value="devops">DevOps & Container</option>
              </>
            )}
          </select>

          <Input
            placeholder="Tags (phân cách bằng dấu phẩy)"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-1/2 text-xs font-mono"
          />
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
                  <span>SOẠN THẢO MARKDOWN (EDITOR)</span>
                  <span>{content.length} ký tự • {content.split(/\s+/).filter(Boolean).length} từ</span>
                </div>
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full flex-1 min-h-[440px] p-4 bg-[#090D16] text-text-main font-mono text-xs leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  placeholder="Nhập nội dung markdown chuẩn: **in đậm**, *nghiêng*, ## tiêu đề, ```cpp khối code..."
                />
              </div>
            )}

            {/* Live Preview */}
            {(viewMode === 'split' || viewMode === 'preview') && (
              <div className="flex flex-col h-full bg-[#0E1526]/60">
                <div className="px-4 py-2 bg-surface-elevated/30 border-b border-surface-border/60 flex items-center justify-between text-[11px] text-text-subtle font-mono">
                  <span className="flex items-center gap-1.5 text-brand-secondary">
                    <span className="w-2 h-2 rounded-full bg-status-success animate-pulse inline-block" />
                    XEM TRƯỚC THỜI GIAN THỰC (LIVE MARKDOWN PREVIEW)
                  </span>
                  <div className="flex items-center gap-1">
                    {parsedTags.map((t) => (
                      <Badge key={t} variant="tech" size="sm">#{t}</Badge>
                    ))}
                  </div>
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
                      Chưa có nội dung. Hãy nhập markdown hoặc sử dụng các phím trên thanh công cụ để bắt đầu.
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
            <span>Hướng dẫn cú pháp chuẩn Markdown cho lập trình viên DevRadar</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px] text-text-muted">
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-text-main">Tiêu đề & Chữ:</span>
              <code>## Tiêu đề lớn</code>
              <code>### Tiêu đề phụ</code>
              <code>**In đậm** / *In nghiêng*</code>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-text-main">Khối mã (Code Blocks):</span>
              <code>```cpp // C++ code</code>
              <code>```csharp // C# code</code>
              <code>```python // Python code</code>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-text-main">Mã nội dòng & Liên kết:</span>
              <code>`console.log()`</code>
              <code>[Tiêu đề](https://...)</code>
              <code>~~Gạch ngang~~</code>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-text-main">Hộp cảnh báo (Alerts):</span>
              <code>&gt; [!NOTE] Lưu ý</code>
              <code>&gt; [!TIP] Mẹo hay</code>
              <code>&gt; [!WARNING] Cảnh báo</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
