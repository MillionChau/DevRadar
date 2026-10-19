import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { AppIcon } from '../../components/common/Icon';

interface WhitepaperReport {
  id: string;
  title: string;
  period: string;
  author: string;
  summary: string;
  downloadCount: number;
  fileSize: string;
}

export const AnalyticsReports: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState('2026');

  const reports: WhitepaperReport[] = [
    {
      id: 'rep-01',
      title: 'Báo cáo Xu hướng Microservices & Hiệu năng YARP Reverse Proxy Q3/2026',
      period: 'Quý 3, 2026',
      author: 'DevRadar Analytics Team',
      summary: 'Khảo sát hiệu năng và độ trễ trên 1.400 repositories .NET và Node.js khi áp dụng YARP Gateway và Redis token caching.',
      downloadCount: 1420,
      fileSize: '4.8 MB (PDF)',
    },
    {
      id: 'rep-02',
      title: 'Đánh giá Độ chính xác của AI Toxicity HuggingFace trong Kiểm duyệt Cộng đồng',
      period: 'Quý 2, 2026',
      author: 'AI Safety Research Lab',
      summary: 'Nghiên cứu tỷ lệ False Positive / False Negative của mô hình RoBERTa trên tập 50.000 bình luận lập trình viên tại Việt Nam.',
      downloadCount: 980,
      fileSize: '3.2 MB (PDF)',
    },
    {
      id: 'rep-03',
      title: 'Radar Chart Năng lực Lập trình viên: Phương pháp Chuẩn hóa Điểm từ GitHub',
      period: 'Quý 1, 2026',
      author: 'Châu Hoàng Tấn & HCMUS Group',
      summary: 'Đặc tả thuật toán trích xuất 5 trục năng lực (Code quality, Activity, Community, Reputation, Stack depth) từ GitHub GraphQL.',
      downloadCount: 2150,
      fileSize: '5.6 MB (PDF)',
    },
    {
      id: 'rep-04',
      title: 'Toàn cảnh Hệ sinh thái Backend .NET 10 & Công nghệ Đám mây Cloud-Native',
      period: 'Năm 2025 - 2026',
      author: 'DevRadar Tech Council',
      summary: 'Tổng hợp thống kê các thư viện C# phổ biến nhất, xu hướng di chuyển từ Monolith sang Microservices và các mẫu kiến trúc DDD.',
      downloadCount: 3400,
      fileSize: '6.1 MB (PDF)',
    },
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-xl font-bold text-text-main">
            DANH MỤC BÁO CÁO PHÂN TÍCH XU HƯỚNG CÔNG NGHỆ (SCR-13)
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Các tài liệu nghiên cứu chuyên sâu (Whitepapers) được tổng hợp tự động từ dữ liệu DevRadar
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

      {/* Reports Grid (4 Cards matching Wireframe) */}
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
                <Badge variant="reputation" size="sm">
                  {rep.period}
                </Badge>
                <span className="text-[11px] text-text-subtle font-mono">{rep.fileSize}</span>
              </div>

              <h2 className="text-base font-bold text-text-main hover:text-brand-secondary cursor-pointer leading-snug">
                {rep.title}
              </h2>

              <p className="text-xs text-text-muted leading-relaxed line-clamp-3">
                {rep.summary}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-surface-border">
              <span className="text-[11px] text-text-subtle">
                Tác giả: <strong className="text-text-main">{rep.author}</strong>
              </span>

              <Button
                variant="primary"
                size="sm"
                icon="download"
                onClick={() => alert(`Đang tải báo cáo: ${rep.title}`)}
              >
                Tải PDF ({rep.downloadCount})
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AnalyticsReports;
