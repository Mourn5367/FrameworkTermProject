'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Footer from '@/components/layout/Footer';
import SearchSection from '@/components/search/SearchSection';
import ItemPriceTable, { PriceItem } from '@/components/item/ItemPriceTable';
import NoticeSection, { Notice } from '@/components/notice/NoticeSection';
import UpdateSection, { Update } from '@/components/notice/UpdateSection';

export default function Home() {
  const router = useRouter();

  const handleSearch = (server: string, nickname: string) => {
    // 검색 페이지로 이동
    router.push(`/search?server=${encodeURIComponent(server)}&name=${encodeURIComponent(nickname)}`);
  };

  // 아이템 시세 데이터
  const priceItems: PriceItem[] = [
    {
      id: 1,
      name: '전설의 검',
      grade: '전설',
      price: 10000,
      change: 100,
      changeDirection: 'up'
    },
    {
      id: 2,
      name: '빛나는 갑옷의 조각',
      grade: '신화',
      price: 900000,
      change: 1000,
      changeDirection: 'down'
    }
  ];

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
              className="mx-auto"
              priority
            />
          </div>

          {/* 검색 섹션 */}
          <SearchSection onSearch={handleSearch} />

          {/* 실시간 아이템 시세 테이블 */}
          <ItemPriceTable items={priceItems} />

          {/* 크롤링 데이터 위젯 */}
          <div className="bg-white rounded-xl shadow-md mb-6 p-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--primary)' }}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800">크롤링 데이터 위젯</h3>
                <p className="text-sm text-gray-500">공지사항 전</p>
              </div>
            </div>
            <p className="text-center text-gray-600 text-sm">
              실시간 크롤링으로 데이터를 수집하여 통계를 작업합니다.
              <br />
              최신 업데이트 날짜 및 매물 정보를 지속적으로 업데이트합니다.
            </p>
          </div>

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
