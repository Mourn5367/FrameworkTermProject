'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Footer from '@/components/layout/Footer';
import SearchSection from '@/components/search/SearchSection';
import AuctionTableWithAccordion from '@/components/auction/AuctionTableWithAccordion';
import AuctionTableSkeleton from '@/components/auction/AuctionTableSkeleton';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

interface AuctionItem {
  id: number;
  auctionNo: number;
  regDate: string;
  count: number;
  currentPrice: number;
  unitPrice: number;
}

interface SoldHistory {
  id: number;
  soldDate: string;
  count: number;
  price: number;
  unitPrice: number;
}

export default function AuctionPage() {
  const router = useRouter();
  const [trackedItems, setTrackedItems] = useState<TrackedItem[]>([]);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [chartData, setChartData] = useState<{ [key: string]: ChartData }>({});
  const [auctionItems, setAuctionItems] = useState<{ [key: string]: AuctionItem[] }>({});
  const [soldHistory, setSoldHistory] = useState<{ [key: string]: SoldHistory[] }>({});
  const [chartInterval, setChartInterval] = useState<{ [key: string]: number }>({});
  const chartRefs = React.useRef<{ [key: string]: HTMLDivElement | null }>({});

  const MAX_CANDLES = 20; // 최대 캔들 표시 개수

  // 차트 데이터 메모이제이션 (chartData와 interval이 변경될 때만 재계산)
  const memoizedChartDisplayData = useMemo(() => {
    const result: { [key: string]: any[] } = {};

    Object.keys(chartData).forEach(itemId => {
      const data = chartData[itemId];
      if (!data) return;

      const intervalMinutes = chartInterval[itemId] || 5;
      const aggregatedData: any[] = [];

      // 시간 기준으로 그룹핑 (정확한 시간 간격)
      const grouped = new Map<number, {
        labels: string[];
        minPrices: (number | null)[];
        soldAvgPrices: (number | null)[];
        soldMaxPrices: (number | null)[];
        itemCounts: (number | null)[];
        soldCounts: (number | null)[];
      }>();

      for (let i = 0; i < data.labels.length; i++) {
        const timestamp = new Date(data.labels[i]).getTime();
        // intervalMinutes 단위로 그룹핑 (예: 5분이면 0, 5, 10, 15... 분에 해당하는 구간)
        const bucketTime = Math.floor(timestamp / (intervalMinutes * 60 * 1000)) * (intervalMinutes * 60 * 1000);

        if (!grouped.has(bucketTime)) {
          grouped.set(bucketTime, {
            labels: [],
            minPrices: [],
            soldAvgPrices: [],
            soldMaxPrices: [],
            itemCounts: [],
            soldCounts: [],
          });
        }

        const bucket = grouped.get(bucketTime)!;
        bucket.labels.push(data.labels[i]);
        bucket.minPrices.push(data.minPrices[i]);
        bucket.soldAvgPrices.push(data.soldAvgPrices[i]);
        bucket.soldMaxPrices.push(data.soldMaxPrices[i]);
        bucket.itemCounts.push(data.itemCounts[i]);
        bucket.soldCounts.push(data.soldCounts[i]);
      }

      // 시간순 정렬 후 집계
      const sortedBuckets = Array.from(grouped.entries()).sort((a, b) => a[0] - b[0]);

      for (const [bucketTime, rangeData] of sortedBuckets) {
        const date = new Date(bucketTime);
        const validMinPrices = rangeData.minPrices.filter(p => p && p > 0);
        const validAvgPrices = rangeData.soldAvgPrices.filter(p => p && p > 0);
        const validMaxPrices = rangeData.soldMaxPrices.filter(p => p && p > 0);
        const totalItemCount = rangeData.itemCounts.reduce((sum, c) => sum + (c || 0), 0);
        const totalSoldCount = rangeData.soldCounts.reduce((sum, c) => sum + (c || 0), 0);

        // 평균가 계산
        const avgPrice = validAvgPrices.length > 0
          ? Math.round(validAvgPrices.reduce((a, b) => a + b, 0) / validAvgPrices.length)
          : null;

        // 최고가: 평균가의 5배 이하인 정상 거래만 필터링
        const normalMaxPrices = avgPrice
          ? validMaxPrices.filter(p => p <= avgPrice * 5)
          : validMaxPrices;

        // 원본 최고가 (이상치 포함)
        const maxPriceWithOutlier = validMaxPrices.length > 0 ? Math.max(...validMaxPrices) : null;

        // 정상 최고가 (이상치 제외)
        const maxPriceNormal = normalMaxPrices.length > 0 ? Math.max(...normalMaxPrices) : null;

        aggregatedData.push({
          time: date.toLocaleString('ko-KR', {
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }),
          최저가: validMinPrices.length > 0 ? Math.min(...validMinPrices) : null,
          거래평균가: avgPrice,
          거래최고가_원본: maxPriceWithOutlier, // 툴팁용 (이상치 포함)
          거래최고가: maxPriceNormal, // 차트 선용 (이상치 제외)
          이상치표시: (maxPriceWithOutlier && maxPriceNormal && maxPriceWithOutlier !== maxPriceNormal) ? maxPriceNormal : null,
          등록물량: Math.round(totalItemCount / rangeData.labels.length), // 실제 데이터 개수로 나눔
          거래량: totalSoldCount,
        });
      }

      // 최신 20개만
      const totalCandles = aggregatedData.length;
      const startIdx = Math.max(0, totalCandles - MAX_CANDLES);
      result[itemId] = aggregatedData.slice(startIdx);
    });

    return result;
  }, [chartData, chartInterval]);

  // 검색 핸들러
  const handleSearch = (server: string, nickname: string) => {
    router.push(`/search?server=${encodeURIComponent(server)}&name=${encodeURIComponent(nickname)}`);
  };

  // 차트 영역에서 페이지 스크롤 차단 및 간격 조절 (passive: false 사용)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // 어느 차트에서 이벤트가 발생했는지 찾기
      for (const [itemId, element] of Object.entries(chartRefs.current)) {
        if (element && element.contains(e.target as Node)) {
          // React 이벤트로 변환하여 handleChartWheel 호출
          // 간격(interval): 1분 크롤링 기준
          // 5분(5), 10분(10), 30분(30), 1시간(60), 6시간(360), 12시간(720), 1일(1440), 1주일(10080), 1개월(43200), 3개월(129600), 6개월(259200), 1년(525600)
          const intervals = [5, 10, 30, 60, 360, 720, 1440, 10080, 43200, 129600, 259200, 525600];
          const currentInterval = chartInterval[itemId] || 5;
          const currentIndex = intervals.indexOf(currentInterval);

          let newIndex;
          if (e.deltaY > 0) {
            newIndex = Math.min(currentIndex + 1, intervals.length - 1);
          } else {
            newIndex = Math.max(currentIndex - 1, 0);
          }

          setChartInterval(prev => ({ ...prev, [itemId]: intervals[newIndex] }));
          break;
        }
      }
    };

    const chartElements = Object.values(chartRefs.current).filter(el => el !== null);
    chartElements.forEach(el => {
      if (el) {
        el.addEventListener('wheel', handleWheel, { passive: false });
      }
    });

    return () => {
      chartElements.forEach(el => {
        if (el) {
          el.removeEventListener('wheel', handleWheel);
        }
      });
    };
  }, [expandedItem, chartData, chartInterval]);

  // Tracked Items 로드 및 실시간 갱신
  useEffect(() => {
    loadTrackedItems();

    // 2분마다 자동 갱신
    const interval = setInterval(() => {
      loadTrackedItems();
    }, 120000); // 120초 = 2분

    return () => clearInterval(interval);
  }, []);

  const loadTrackedItems = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auction/tracked-items`);
      const data = await res.json();
      setTrackedItems(data);

      // URL 파라미터 확인
      const params = new URLSearchParams(window.location.search);
      const urlItemId = params.get('itemId');

      if (urlItemId && data.length > 0) {
        // URL 파라미터가 있으면 해당 아이템만 우선 로드
        await loadPriorityItemData(urlItemId);

        // 나머지 아이템은 백그라운드에서 로드
        loadAllChartData(data.filter((item: TrackedItem) => item.itemId !== urlItemId));
      } else {
        // URL 파라미터 없으면 모든 아이템 차트 데이터 미리 로드
        if (data && data.length > 0) {
          loadAllChartData(data);
        }
      }
    } catch (error) {
      console.error('Failed to load tracked items:', error);
    }
  };

  // 우선순위 아이템 데이터 로드 (차트 + 등록물량 + 최근거래 동시 로드)
  const loadPriorityItemData = async (itemId: string) => {
    try {
      // 3개 API를 병렬로 동시 호출
      const [chartRes, itemsRes, soldRes] = await Promise.all([
        fetch(`${API_URL}/api/auction/items/${itemId}/chart?days=7`),
        fetch(`${API_URL}/api/auction/items/${itemId}`),
        fetch(`${API_URL}/api/auction/items/${itemId}/sold-history?limit=10`)
      ]);

      // 차트 데이터
      if (chartRes.ok) {
        const chartData = await chartRes.json();
        setChartData(prev => ({ ...prev, [itemId]: chartData }));
      }

      // 현재 매물
      if (itemsRes.ok) {
        const items = await itemsRes.json();
        setAuctionItems(prev => ({ ...prev, [itemId]: items }));
      }

      // 판매 내역
      if (soldRes.ok) {
        const sold = await soldRes.json();
        setSoldHistory(prev => ({ ...prev, [itemId]: sold }));
      }

      // 데이터 로드 완료 후 아코디언 열기
      setExpandedItem(itemId);
    } catch (error) {
      console.error(`Failed to load priority item data for ${itemId}:`, error);
    }
  };

  // 특정 아이템의 차트 데이터 로드
  const loadChartData = async (itemId: string, days: number) => {
    try {
      const chartRes = await fetch(`${API_URL}/api/auction/items/${itemId}/chart?days=${days}`);
      if (chartRes.ok) {
        const data = await chartRes.json();
        setChartData(prev => ({ ...prev, [itemId]: data }));
      }
    } catch (error) {
      console.error(`Failed to load chart data for ${itemId}:`, error);
    }
  };

  // 모든 아이템의 차트 데이터 미리 로드
  const loadAllChartData = async (items: TrackedItem[]) => {
    const promises = items.map(async (item) => {
      try {
        const chartRes = await fetch(`${API_URL}/api/auction/items/${item.itemId}/chart?days=7`);
        if (chartRes.ok) {
          const data = await chartRes.json();
          return { itemId: item.itemId, data };
        }
      } catch (error) {
        console.error(`Failed to load chart data for ${item.itemId}:`, error);
      }
      return null;
    });

    const results = await Promise.all(promises);

    // 기존 chartData를 덮어쓰지 않고 병합
    results.forEach((result) => {
      if (result) {
        setChartData(prev => ({ ...prev, [result.itemId]: result.data }));
      }
    });
  };

  // 아이템 확장 시 상세 데이터 로드
  const handleExpandItem = async (itemId: string) => {
    if (expandedItem === itemId) {
      setExpandedItem(null);
      return;
    }

    setExpandedItem(itemId);

    // 차트 데이터, 현재 매물, 판매 내역을 병렬로 로드
    const promises = [];

    // 차트 데이터가 없으면 로드
    if (!chartData[itemId]) {
      promises.push(
        fetch(`${API_URL}/api/auction/items/${itemId}/chart?days=7`)
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data) {
              setChartData(prev => ({ ...prev, [itemId]: data }));
            }
          })
          .catch(err => console.error(`Failed to load chart data for ${itemId}:`, err))
      );
    }

    // 등록 물량이 없으면 로드
    if (!auctionItems[itemId]) {
      promises.push(
        fetch(`${API_URL}/api/auction/items/${itemId}`)
          .then(res => res.ok ? res.json() : null)
          .then(items => {
            if (items) {
              setAuctionItems(prev => ({ ...prev, [itemId]: items }));
            }
          })
          .catch(err => console.error(`Failed to load auction items for ${itemId}:`, err))
      );
    }

    // 최근 거래가 없으면 로드
    if (!soldHistory[itemId]) {
      promises.push(
        fetch(`${API_URL}/api/auction/items/${itemId}/sold-history?limit=10`)
          .then(res => res.ok ? res.json() : null)
          .then(sold => {
            if (sold) {
              setSoldHistory(prev => ({ ...prev, [itemId]: sold }));
            }
          })
          .catch(err => console.error(`Failed to load sold history for ${itemId}:`, err))
      );
    }

    // 모든 요청을 병렬로 실행
    if (promises.length > 0) {
      await Promise.all(promises);
    }
  };

  // 가격 포맷 (1원 단위까지 표시)
  const formatPrice = (price: number) => {
    return price.toLocaleString() + '골드';
  };

  // 차트 Y축 전용 포맷 (자세하게 표시)
  const formatChartPrice = (price: number) => {
    return price.toLocaleString();
  };

  // 시간 경과 표시
  const getTimeAgo = (dateStr: string) => {
    const now = new Date();
    const past = new Date(dateStr);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${diffDays}일 전`;
  };

  // 차트용 데이터 변환 (메모이제이션된 데이터 반환)
  const getChartDataForDisplay = (itemId: string) => {
    return memoizedChartDisplayData[itemId] || [];
  };

  // 가격 Y축 domain (왼쪽)
  const getPriceYAxisDomain = (itemId: string): [number, number] => {
    const displayData = getChartDataForDisplay(itemId);
    if (!displayData || displayData.length === 0) {
      return [0, 1];
    }

    // 차트에 표시되는 가격만 수집 (이상치 필터링된 데이터)
    const allPrices: number[] = [];
    displayData.forEach(d => {
      if (d.최저가 && d.최저가 > 0) allPrices.push(d.최저가);
      if (d.거래평균가 && d.거래평균가 > 0) allPrices.push(d.거래평균가);
      if (d.거래최고가 && d.거래최고가 > 0) allPrices.push(d.거래최고가);
    });

    if (allPrices.length === 0) return [0, 1];

    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const range = maxPrice - minPrice;
    const padding = range * 0.1;

    return [
      Math.max(0, Math.floor(minPrice - padding)),
      Math.ceil(maxPrice + padding)
    ];
  };

  // 등록물량 Y축 domain (오른쪽 1)
  const getItemCountYAxisDomain = (itemId: string): [number, number] => {
    const displayData = getChartDataForDisplay(itemId);
    if (!displayData || displayData.length === 0) {
      return [0, 'auto' as any];
    }

    const itemCounts = displayData.map(d => d.등록물량 || 0).filter(v => v > 0);
    if (itemCounts.length === 0) return [0, 'auto' as any];

    const maxCount = Math.max(...itemCounts);
    return [0, Math.ceil(maxCount * 1.1)];
  };

  // 거래량 Y축 domain (오른쪽 2)
  const getSoldCountYAxisDomain = (itemId: string): [number, number] => {
    const displayData = getChartDataForDisplay(itemId);
    if (!displayData || displayData.length === 0) {
      return [0, 'auto' as any];
    }

    const soldCounts = displayData.map(d => d.거래량 || 0).filter(v => v > 0);
    if (soldCounts.length === 0) return [0, 'auto' as any];

    const maxCount = Math.max(...soldCounts);
    return [0, Math.ceil(maxCount * 1.5)]; // 1.5배 여유로 선이 잘 보이도록
  };

  // 1주 전, 어제 가격 계산 (최저가 기준)
  const getPriceComparison = (itemId: string) => {
    const data = chartData[itemId];
    if (!data || data.minPrices.length === 0) {
      return { current: 0, weekAgo: 0, yesterday: 0, weekChange: 0, dayChange: 0, totalItems: 0 };
    }

    // 현재 최저가
    const current = data.minPrices[data.minPrices.length - 1];

    // 1주 전 최저가 (7일 × 720회/일 = 5040 인덱스 전, 없으면 처음)
    const weekAgoIdx = Math.max(0, data.minPrices.length - 5040);
    const weekAgo = data.minPrices[weekAgoIdx];

    // 어제 최저가 (720회/일, 없으면 처음)
    const yesterdayIdx = Math.max(0, data.minPrices.length - 720);
    const yesterday = data.minPrices[yesterdayIdx];

    const weekChange = weekAgo > 0 ? ((current - weekAgo) / weekAgo) * 100 : 0;
    const dayChange = yesterday > 0 ? ((current - yesterday) / yesterday) * 100 : 0;

    // 현재 등록된 총 물량
    const totalItems = data.itemCounts[data.itemCounts.length - 1] || 0;

    return { current, weekAgo, yesterday, weekChange, dayChange, totalItems };
  };

  return (
    <div className="page-wrapper bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="flex-1">
        <div className="app-container py-8">
          {/* 로고 */}
          <div className="text-center mb-6">
            <Image
              src="/images/logo.png"
              alt="DunSight"
              width={300}
              height={80}
              className="mx-auto cursor-pointer"
              priority
              onClick={() => router.push('/')}
            />
          </div>

          {/* 검색 섹션 */}
          <SearchSection onSearch={handleSearch} />

          {trackedItems.length === 0 ? (
            <AuctionTableSkeleton rows={3} showDetailsColumn={false} />
          ) : (
            <AuctionTableWithAccordion
              trackedItems={trackedItems}
              chartData={chartData}
              auctionItems={auctionItems}
              soldHistory={soldHistory}
              expandedItem={expandedItem}
              onExpandItem={handleExpandItem}
              chartInterval={chartInterval}
              onChartIntervalChange={(itemId, interval) => setChartInterval(prev => ({ ...prev, [itemId]: interval }))}
              chartRefs={chartRefs}
              getChartDataForDisplay={getChartDataForDisplay}
              getPriceYAxisDomain={getPriceYAxisDomain}
              getItemCountYAxisDomain={getItemCountYAxisDomain}
              getSoldCountYAxisDomain={getSoldCountYAxisDomain}
              formatPrice={formatPrice}
              formatChartPrice={formatChartPrice}
              getTimeAgo={getTimeAgo}
              enableAccordion={true}
            />
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
