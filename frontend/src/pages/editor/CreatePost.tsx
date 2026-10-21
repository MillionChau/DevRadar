import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input, { Textarea } from '../../components/common/Input';
import { AppIcon } from '../../components/common/Icon';
import { communityApi } from '../../api';
import { TechZone } from '../../types';

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

      navigate('/');
    } catch (err: any) {
      console.warn('Create post error from API Gateway / QualityService:', err);
      const msg = err?.message || err?.data?.message || 'Có lỗi xảy ra khi đăng bài.';

      if (msg.toLowerCase().includes('toxic') || msg.toLowerCase().includes('kiểm duyệt') || msg.toLowerCase().includes('non-it')) {
        setAiWarning(`Hệ thống QualityService phát hiện nội dung có thể vi phạm tiêu chuẩn cộng đồng: "${msg}". Vui lòng điều chỉnh từ ngữ.`);
      } else {
        setErrorMessage(msg);
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
          <Button variant="ghost" size="sm" icon="arrowRight" className="rotate-180" onClick={() => navigate(-1)}>
            Quay lại
          </Button>
          <h1 className="text-lg font-bold text-text-main">Soạn thảo Bài viết mới (SCR-08)</h1>
          <Badge variant="reputation" size="sm">Bản nháp</Badge>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setAiWarning(aiWarning ? null : 'Cảnh báo mẫu: Nội dung có thể vi phạm tiêu chuẩn cộng đồng.')}>
            {aiWarning ? 'Tắt thử nghiệm AI' : 'Thử nghiệm cảnh báo AI'}
          </Button>
          <Button variant="primary" size="sm" icon="send" isLoading={isSubmitting} onClick={handlePublish}>
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

      {/* Split-View: Markdown Editor & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[500px]">
        {/* Left: Editor Textarea */}
        <Card variant="default" padding="none" className="flex flex-col h-full overflow-hidden">
          <div className="px-4 py-2.5 bg-surface-elevated/40 border-b border-surface-border flex items-center justify-between text-xs text-text-subtle font-mono">
            <span>MARKDOWN EDITOR</span>
            <span>Hỗ trợ cú pháp GitHub Flavour</span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full flex-1 p-4 bg-surface-card text-text-main font-mono text-xs leading-relaxed resize-none focus:outline-none"
            placeholder="Viết nội dung bài viết bằng Markdown..."
          />
        </Card>

        {/* Right: Live Preview */}
        <Card variant="default" padding="none" className="flex flex-col h-full overflow-hidden bg-surface-elevated/20">
          <div className="px-4 py-2.5 bg-surface-elevated/40 border-b border-surface-border flex items-center justify-between text-xs text-text-subtle font-mono">
            <span>LIVE PREVIEW</span>
            <div className="flex items-center gap-1.5">
              {parsedTags.map((t) => (
                <Badge key={t} variant="tech" size="sm">#{t}</Badge>
              ))}
            </div>
          </div>
          <div className="p-6 overflow-y-auto prose prose-invert text-xs text-text-main leading-relaxed">
            <h1 className="text-lg font-bold text-text-main mb-3">
              {title || 'Tiêu đề bài viết xem trước'}
            </h1>
            <div className="whitespace-pre-wrap">{content}</div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CreatePost;
