import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input, { Textarea } from '../../components/common/Input';
import { AppIcon } from '../../components/common/Icon';

export const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [techZone, setTechZone] = useState('dotnet');
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
  const [aiWarning, setAiWarning] = useState(false);

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/');
    }, 600);
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
          <Button variant="outline" size="sm" onClick={() => setAiWarning(!aiWarning)}>
            {aiWarning ? 'Tắt thử nghiệm AI' : 'Thử nghiệm cảnh báo AI'}
          </Button>
          <Button variant="primary" size="sm" icon="send" isLoading={isSubmitting} onClick={handlePublish}>
            Xuất bản bài viết
          </Button>
        </div>
      </div>

      {/* AI Toxicity Alert Banner (if simulated) */}
      {aiWarning && (
        <div className="p-4 bg-status-danger/10 border border-status-danger/30 rounded-card flex items-start gap-3 text-xs">
          <div className="text-status-danger mt-0.5">
            <AppIcon name="alert" size={18} />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-status-danger text-sm mb-1">
              Cảnh báo Kiểm duyệt AI HuggingFace (toxicityScore: 0.88 &gt; 0.8)
            </h4>
            <p className="text-text-muted leading-relaxed">
              Bài viết của bạn chứa một số từ ngữ có thể vi phạm tiêu chuẩn cộng đồng. Nếu xuất bản, bài viết sẽ được tự động chuyển sang hàng chờ kiểm duyệt (SCR-20) trước khi hiển thị công khai.
            </p>
          </div>
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
            <option value="dotnet">.NET Core</option>
            <option value="react">React & UI</option>
            <option value="microservices">Microservices</option>
            <option value="crawler">GitHub Crawler</option>
            <option value="devops">DevOps</option>
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
