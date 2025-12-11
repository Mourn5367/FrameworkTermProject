'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Footer from '@/components/layout/Footer';
import SearchSection from '@/components/search/SearchSection';
import NoticeSection, { Notice } from '@/components/notice/NoticeSection';
import UpdateSection, { Update } from '@/components/notice/UpdateSection';
import AuctionTableWithAccordion from '@/components/auction/AuctionTableWithAccordion';
import AuctionTableSkeleton from '@/components/auction/AuctionTableSkeleton';
import WordCloudWidget from '@/components/wordcloud/WordCloudWidget';

const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? `http://${window.location.hostname}:8080`
  : 'http://localhost:8080';

interface TrackedItem {
  id: number;
  itemId: string;
  itemName: string;
  itemImageUrl: string;
  addedAt: string;
}

interface ChartData {
  itemId: string;
  itemName: string;
  labels: string[];
  avgPrices: number[];
  minPrices: number[];
  soldAvgPrices: (number | null)[];
  soldMaxPrices: (number | null)[];
  soldCounts: number[];
  itemCounts: number[];
}

export default function Home() {
  const router = useRouter();
  const [trackedItems, setTrackedItems] = useState<TrackedItem[]>([]);
  const [chartData, setChartData] = useState<{ [key: string]: ChartData }>({});
  const [loading, setLoading] = useState(true);

  const handleSearch = (server: string, nickname: string) => {
    // 검색 페이지로 이동
    router.push(`/search?server=${encodeURIComponent(server)}&name=${encodeURIComponent(nickname)}`);
  };

  // 추적 아이템 목록 불러오기
  useEffect(() => {
    const loadTrackedItems = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auction/tracked-items`);
        const data = await res.json();
        setTrackedItems(data);

        // 모든 아이템의 차트 데이터 로드
        if (data && data.length > 0) {
          await loadAllChartData(data);
        }
      } catch (error) {
        console.error('Failed to load tracked items:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTrackedItems();
  }, []);

  // 모든 아이템의 차트 데이터 로드
  const loadAllChartData = async (items: TrackedItem[]) => {
    const promises = items.map(async (item) => {
      try {
        const chartRes = await fetch(`${API_URL}/api/auction/items/${item.itemId}/chart?days=30`);
        if (chartRes.ok) {
          const data = await chartRes.json();
          setChartData(prev => ({ ...prev, [item.itemId]: data }));
        } else {
          console.error(`Failed to fetch chart data for ${item.itemId}: ${chartRes.status}`);
        }
      } catch (error) {
        console.error(`Failed to load chart data for ${item.itemId}:`, error);
      }
    });

    await Promise.all(promises);
  };

  // 공지사항 데이터
  const notices: Notice[] = [
    {
      id: 1,
      title: '던파 인사이트 베타 서비스 오픈 안내',
      date: '2025.01.15',
      content: '던파 인사이트 베타 서비스가 오픈되었습니다. 캐릭터 검색, 경매장 시세 조회 등 다양한 기능을 이용해보세요. 많은 관심 부탁드립니다!'
    },
    {
      id: 2,
      title: '경매장 시세 크롤링 기능 추가',
      date: '2025.01.10',
      content: '5분 간격으로 경매장 시세를 자동으로 수집하는 기능이 추가되었습니다. 실시간 가격 추이를 확인하실 수 있습니다.'
    },
    {
      id: 3,
      title: '캐릭터 검색 기능 개선 안내',
      date: '2025.01.05',
      content: '캐릭터 검색 속도가 개선되었으며, 더 상세한 정보를 제공합니다.'
    }
  ];

  // 업데이트 데이터
  const updates: Update[] = [
    {
      id: 1,
      date: '2025.01.15',
      title: 'v1.2.0 업데이트',
      content: '- AI 기반 장비 추천 기능 추가\n- 캐릭터 비교 분석 기능 개선\n- 경매장 알림 기능 추가\n- 전체적인 UI/UX 개선'
    },
    {
      id: 2,
      date: '2025.01.12',
      title: 'v1.1.5 핫픽스',
      content: '- 캐릭터 정보 로딩 속도 50% 개선\n- 검색 결과 캐싱 시스템 도입\n- 메모리 누수 이슈 해결'
    },
    {
      id: 3,
      date: '2025.01.08',
      title: 'v1.1.0 업데이트',
      content: '- 경매장 시세 그래프 UI 개선\n- 실시간 가격 알림 기능 추가'
    }
  ];

  return (
    <div className="page-wrapper" style={{ background: 'var(--background)' }}>
      <div className="flex-1">
        <div className="app-container py-8">
          {/* 로고 */}
          <div className="text-center mb-6">
            <Image
              src="/images/logo.png"
              alt="DunSight"
              width={300}
              height={80}
              className="mx-auto cursor-pointer hover:opacity-80 transition-opacity"
              priority
              onClick={() => router.push('/')}
            />
          </div>

          {/* 검색 섹션 */}
          <SearchSection onSearch={handleSearch} />

          {/* 실시간 아이템 시세 */}
          {loading ? (
            <div className="mb-6">
              <AuctionTableSkeleton rows={3} showDetailsColumn={true} />
            </div>
          ) : trackedItems.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md mb-6 p-8 text-center text-gray-500">
              추적 중인 아이템이 없습니다
            </div>
          ) : (
            <div className="mb-6">
              <AuctionTableWithAccordion
                trackedItems={trackedItems}
                chartData={chartData}
                auctionItems={{}}
                soldHistory={{}}
                expandedItem={null}
                onExpandItem={() => {}}
                chartInterval={{}}
                onChartIntervalChange={() => {}}
                chartRefs={{ current: {} }}
                getChartDataForDisplay={() => []}
                getPriceYAxisDomain={() => [0, 1]}
                getItemCountYAxisDomain={() => [0, 1]}
                getSoldCountYAxisDomain={() => [0, 1]}
                formatPrice={(price) => price.toLocaleString() + '골드'}
                formatChartPrice={(price) => price.toLocaleString()}
                getTimeAgo={() => ''}
                enableAccordion={false}
              />
            </div>
          )}

          {/* 워드클라우드 위젯 */}
          <WordCloudWidget />

          {/* 공지사항 섹션 */}
          <NoticeSection notices={notices} />

          {/* 업데이트 사항 섹션 */}
          <UpdateSection updates={updates} />
        </div>
      </div>

      {/* 푸터 */}
      <Footer />
    </div>
  );
}
