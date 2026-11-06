import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { AppIcon } from '../../components/common/Icon';
import { analyticsApi } from '../../api';
import { toast } from '../../context/ToastContext';

interface WhitepaperReport {
  id: string;
  title: string;
  category: string;
  author: string;
  summary: string;
  downloadCount: number;
  fileSize: string;
}

export const AnalyticsReports: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [reports, setReports] = useState<WhitepaperReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoading(true);
    analyticsApi
      .getReports(20, selectedCategory === 'all' ? undefined : selectedCategory)
      .then((data) => {
        const items: any[] = Array.isArray(data) ? data : (data as any)?.items || [];
        if (Array.isArray(items)) {
          const liveReports: WhitepaperReport[] = items.map((r: any) => ({
            id: r.id || r._id,
            title: r.title || 'Báo cáo Phân tích Xu hướng Công nghệ AI',
            category: r.category || 'TREND',
            author: r.author_name || r.author || 'DevRadar AI Analyst',
            summary: r.summary || (r.content_markdown ? r.content_markdown.substring(0, 160) + '...' : 'Tài liệu nghiên cứu kỹ thuật.'),
            downloadCount: r.views_count || 120,
            fileSize: 'Markdown / Web',
          }));
          setReports(liveReports);
        }
      })
      .catch((err) => {
        console.error('Could not load AI reports from CrawlerService:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [selectedYear, selectedCategory]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-xl font-bold text-text-main flex items-center gap-2">
            <span>DANH MỤC BÁO CÁO PHÂN TÍCH XU HƯỚNG CÔNG NGHỆ</span>
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Báo cáo suy luận định lượng chuyên sâu (Whitepapers) và Đánh giá Sức khỏe Kho mã nguồn được tự động sinh bởi DevRadar Cognitive Agent
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-surface-elevated border border-surface-border text-text-main text-xs rounded-btn px-3 h-9 focus:outline-none"
          >
            <option value="2026">Năm 2026</option>
            <option value="2025">Năm 2025</option>
          </select>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-surface-border">
        {[
          { key: 'all', label: 'Tất cả Báo cáo' },
          { key: 'MONTHLY_TREND', label: '📅 Xu hướng Tháng' },
          { key: 'REPOSITORY', label: '🔍 Đánh giá Kho mã nguồn' },
          { key: 'LANGUAGE', label: 'Ngôn ngữ Lập trình' },
          { key: 'FRAMEWORK', label: 'Framework' },
          { key: 'DEVOPS', label: 'DevOps & Cloud' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedCategory(tab.key)}
            className={`px-3 py-1.5 rounded-btn text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === tab.key
                ? 'bg-brand-primary text-white font-semibold shadow-sm'
                : 'bg-surface-elevated text-text-muted hover:text-text-main hover:bg-surface-border'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reports Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-text-muted">Đang tải các bài phân tích xu hướng công nghệ từ MongoDB...</span>
        </div>
      ) : reports.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 border border-dashed border-surface-border rounded-xl">
          <AppIcon name="fileText" size={32} className="text-text-subtle" />
          <span className="text-sm font-semibold text-text-main">Chưa có bài báo cáo công nghệ nào</span>
          <span className="text-xs text-text-muted">Hệ thống AI sẽ tự động lập lịch xuất bản các tài liệu phân tích mới.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reports.map((rep) => (
          <Card
            key={rep.id}
            variant="default"
            padding="lg"
            className="flex flex-col justify-between gap-4 hover:border-brand-primary/40 transition-colors"
          >
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                {rep.category === 'MONTHLY_TREND' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                    📅 Xu hướng Tháng
                  </span>
                ) : rep.category === 'REPOSITORY' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                    🔍 Đánh giá Repo
                  </span>
                ) : (
                  <Badge variant="reputation" size="sm">
                    {rep.category}
                  </Badge>
                )}
                <span className="text-[11px] text-text-subtle font-mono">{rep.fileSize}</span>
              </div>

              <h2
                onClick={() => navigate(`/analytics/reports/${rep.id}`)}
                className="text-base font-bold text-text-main hover:text-brand-secondary cursor-pointer leading-snug"
              >
                {rep.title}
              </h2>

              <p
                onClick={() => navigate(`/analytics/reports/${rep.id}`)}
                className="text-xs text-text-muted leading-relaxed line-clamp-3 cursor-pointer"
              >
                {rep.summary}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-surface-border gap-2 flex-wrap">
              <span className="text-[11px] text-text-subtle">
                Tác giả: <strong className="text-text-main">{rep.author}</strong>
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  icon="bookOpen"
                  onClick={() => navigate(`/analytics/reports/${rep.id}`)}
                  tooltip="Đọc chi tiết và tham gia thảo luận"
                >
                  Đọc & bình luận
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon="download"
                  onClick={() => toast.info(`Đang tạo và tải bản in PDF: ${rep.title}`, 'Tải báo cáo')}
                  tooltip="Tải bản in PDF của báo cáo"
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
      )}
    </div>
  );
};

export default AnalyticsReports;
