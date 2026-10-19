import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import { AppIcon } from '../../components/common/Icon';
import { TechZone } from '../../types';

export const TechZones: React.FC = () => {
  const [search, setSearch] = useState('');
  const [techZones, setTechZones] = useState<TechZone[]>([
    {
      id: 'tz-1',
      name: '.NET Core & C#',
      slug: 'dotnet',
      description: 'Hệ sinh thái Microsoft .NET 10, ASP.NET Core, C# và kiến trúc Enterprise hiện đại.',
      postCount: 142,
      followerCount: 2420,
      isFollowing: true,
    },
    {
      id: 'tz-2',
      name: 'React & Frontend',
      slug: 'react',
      description: 'Phát triển giao diện SPA hiện đại, Vite, Next.js, Tailwind CSS và State Management.',
      postCount: 198,
      followerCount: 3850,
      isFollowing: false,
    },
    {
      id: 'tz-3',
      name: 'Microservices & Distributed Systems',
      slug: 'microservices',
      description: 'Kiến trúc dịch vụ phân tán, YARP Gateway, Event-driven, RabbitMQ và Kafka.',
      postCount: 87,
      followerCount: 1940,
      isFollowing: true,
    },
    {
      id: 'tz-4',
      name: 'GitHub Crawler & Data Analytics',
      slug: 'crawler',
      description: 'Thu thập mã nguồn, trích xuất metrics đóng góp, tính toán Radar Chart và Repo Health.',
      postCount: 64,
      followerCount: 1250,
      isFollowing: false,
    },
    {
      id: 'tz-5',
      name: 'AI Quality & Moderation',
      slug: 'ai-quality',
      description: 'Kiểm duyệt nội dung tự động bằng AI HuggingFace, NLP và bảo vệ an toàn cộng đồng.',
      postCount: 52,
      followerCount: 1100,
      isFollowing: false,
    },
    {
      id: 'tz-6',
      name: 'DevOps, CI/CD & Cloud Infrastructure',
      slug: 'devops',
      description: 'Tự động hóa triển khai, Docker Compose, Kubernetes, GitHub Actions và Monitoring.',
      postCount: 76,
      followerCount: 1680,
      isFollowing: false,
    },
  ]);

  const toggleFollow = (id: string) => {
    setTechZones((prev) =>
      prev.map((tz) =>
        tz.id === id ? { ...tz, isFollowing: !tz.isFollowing } : tz
      )
    );
  };

  const filteredZones = techZones.filter(
    (tz) =>
      tz.name.toLowerCase().includes(search.toLowerCase()) ||
      tz.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-xl font-bold text-text-main">
            KHÁM PHÁ TECHZONES (CÁC KHÔNG GIAN KỸ THUẬT CHUYÊN ĐỀ)
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Theo dõi các chuyên mục công nghệ yêu thích để cá nhân hóa bảng tin bài viết kỹ thuật
          </p>
        </div>

        <div className="w-full md:w-72">
          <Input
            placeholder="Tìm kiếm chuyên mục công nghệ..."
            icon="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* TechZones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredZones.map((zone) => (
          <Card
            key={zone.id}
            variant="default"
            padding="md"
            className="flex flex-col justify-between gap-4 hover:border-brand-primary/40 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-btn bg-brand-primary/10 border border-brand-primary/20 text-brand-secondary flex items-center justify-center font-bold text-sm">
                  <AppIcon name="layers" size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-main hover:text-brand-secondary cursor-pointer">
                    {zone.name}
                  </h3>
                  <span className="text-[11px] text-text-subtle font-mono">
                    #{zone.slug}
                  </span>
                </div>
              </div>

              <Button
                variant={zone.isFollowing ? 'secondary' : 'primary'}
                size="sm"
                icon={zone.isFollowing ? 'check' : 'plus'}
                onClick={() => toggleFollow(zone.id)}
              >
                {zone.isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
              </Button>
            </div>

            <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
              {zone.description}
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-surface-border text-xs text-text-subtle">
              <span>{zone.postCount} bài viết chuyên sâu</span>
              <span>{zone.followerCount.toLocaleString()} người theo dõi</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TechZones;
