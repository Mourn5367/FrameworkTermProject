'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function Home() {
  const [expandedNotice, setExpandedNotice] = useState<number | null>(null);
  const [expandedUpdate, setExpandedUpdate] = useState<number | null>(null);
  const [showAllNotices, setShowAllNotices] = useState(false);
  const [showAllUpdates, setShowAllUpdates] = useState(false);

  const notices = [
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
      content: '캐릭터 검색 속도가 개선되었으며, 더 상세한 정보를 제공합니다. 명성 상위 랭킹과 비교 분석 기능도 곧 추가될 예정입니다.'
    },
    {
      id: 4,
      title: '서비스 이용약관 및 개인정보 처리방침 업데이트',
      date: '2025.01.01',
      content: '서비스 이용약관 및 개인정보 처리방침이 업데이트되었습니다. 자세한 내용은 하단 링크에서 확인하실 수 있습니다.'
    },
    {
      id: 5,
      title: '정기 점검 안내',
      date: '2024.12.28',
      content: '서버 안정화를 위한 정기 점검이 진행됩니다. 점검 시간: 2024.12.30 02:00 ~ 06:00 (4시간)'
    }
  ];

  const updates = [
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
      content: '- 경매장 시세 그래프 UI 개선\n- 실시간 가격 알림 기능 추가\n- 즐겨찾기 기능 개선\n- 다크모드 지원'
    },
    {
      id: 4,
      date: '2025.01.03',
      title: 'v1.0.5 핫픽스',
      content: '- 모바일 반응형 레이아웃 버그 수정\n- iOS Safari 호환성 개선\n- 로그인 세션 관리 개선'
    },
    {
      id: 5,
      date: '2024.12.28',
      title: 'v1.0.0 정식 출시',
      content: '- 던파 인사이트 정식 서비스 오픈\n- 캐릭터 검색 및 분석 기능\n- 경매장 시세 조회 기능\n- 사용자 즐겨찾기 기능'
    }
  ];

  const displayedNotices = showAllNotices ? notices : notices.slice(0, 2);
  const displayedUpdates = showAllUpdates ? updates : updates.slice(0, 2);

  return (
    <div className="page-wrapper bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="flex-1">
        <div className="app-container">
          <Header />

          {/* 아이템 테이블 */}
          <div className="bg-white rounded-2xl shadow-xl mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3">
              <h2 className="text-lg font-bold text-white">실시간 아이템 시세</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-2.5 px-4 text-left font-bold text-gray-700 border-b-2 border-gray-200">아이템 명</th>
                    <th className="py-2.5 px-4 text-center font-bold text-gray-700 border-b-2 border-gray-200">가격</th>
                    <th className="py-2.5 px-4 text-center font-bold text-gray-700 border-b-2 border-gray-200">추이</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-600">-</td>
                    <td className="py-3 px-4 text-center text-gray-600">-</td>
                    <td className="py-3 px-4 text-center text-gray-600">-</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-600">-</td>
                    <td className="py-3 px-4 text-center text-gray-600">-</td>
                    <td className="py-3 px-4 text-center text-gray-600">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 크롤링 데이터 위젯 */}
          <div className="bg-white rounded-2xl shadow-xl p-10 text-center mb-6">
            <div className="space-y-3">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">크롤링 데이터 위젯</h2>
              <p className="text-lg text-gray-600">클라우드 공간</p>
              <p className="text-sm text-gray-500 max-w-md mx-auto">실시간 경매장 데이터와 통계가 이곳에 표시됩니다</p>
            </div>
          </div>

          {/* 공지 / 업데이트 섹션 */}
          <div className="space-y-6 mb-6">
            {/* 공지사항 */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                  공지사항
                </h3>
              </div>
              <div className="p-4">
                <ul className="space-y-1">
                  {displayedNotices.map((notice) => (
                    <li key={notice.id}>
                      <div
                        className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                        onClick={() => setExpandedNotice(expandedNotice === notice.id ? null : notice.id)}
                      >
                        <span className="text-blue-600 font-bold text-xs mt-0.5">•</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-800 hover:text-blue-600 transition-colors">
                              {notice.title}
                            </p>
                            <svg
                              className={`w-4 h-4 text-gray-500 transition-transform ${expandedNotice === notice.id ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{notice.date}</p>
                        </div>
                      </div>
                      {expandedNotice === notice.id && (
                        <div className="ml-6 mr-2 mt-2 mb-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-600 animate-[fadeIn_0.2s_ease-in-out]">
                          <p className="text-sm text-gray-700 leading-relaxed">{notice.content}</p>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                {notices.length > 2 && (
                  <div className="mt-3 text-center">
                    <button
                      onClick={() => setShowAllNotices(!showAllNotices)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors flex items-center gap-1 mx-auto"
                    >
                      {showAllNotices ? (
                        <>
                          <span>접기</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </>
                      ) : (
                        <>
                          <span>더보기 ({notices.length - 2}개)</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 업데이트 사항 */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  업데이트 사항
                </h3>
              </div>
              <div className="p-4">
                <ul className="space-y-1">
                  {displayedUpdates.map((update) => (
                    <li key={update.id}>
                      <div
                        className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                        onClick={() => setExpandedUpdate(expandedUpdate === update.id ? null : update.id)}
                      >
                        <span className="text-purple-600 font-bold text-xs mt-0.5">📌</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold text-gray-800 hover:text-purple-600 transition-colors">
                                {update.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">{update.date}</p>
                            </div>
                            <svg
                              className={`w-4 h-4 text-gray-500 transition-transform ${expandedUpdate === update.id ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      {expandedUpdate === update.id && (
                        <div className="ml-6 mr-2 mt-2 mb-3 p-3 bg-purple-50 rounded-lg border-l-4 border-purple-600 animate-[fadeIn_0.2s_ease-in-out]">
                          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{update.content}</div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                {updates.length > 2 && (
                  <div className="mt-3 text-center">
                    <button
                      onClick={() => setShowAllUpdates(!showAllUpdates)}
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium hover:underline transition-colors flex items-center gap-1 mx-auto"
                    >
                      {showAllUpdates ? (
                        <>
                          <span>접기</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </>
                      ) : (
                        <>
                          <span>더보기 ({updates.length - 2}개)</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 푸터 */}
      <Footer />
    </div>
  );
}
