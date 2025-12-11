'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/common/Modal';
import { SERVER_LIST_KOREAN, getServerIdFromKorean } from '@/utils/serverMapping';

interface SearchSectionProps {
  onSearch?: (server: string, nickname: string) => void;
}

interface SearchHistory {
  server: string;
  nickname: string;
  timestamp: number;
}

export default function SearchSection({ onSearch }: SearchSectionProps) {
  const router = useRouter();
  const [selectedServer, setSelectedServer] = useState('카인');
  const [nickname, setNickname] = useState('');
  const [activeTab, setActiveTab] = useState<number | null>(null);
  const [hoveredTab, setHoveredTab] = useState<number | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // localStorage에서 검색 기록 불러오기
  useEffect(() => {
    const saved = localStorage.getItem('searchHistory');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSearchHistory(parsed);
      } catch (e) {
        console.error('Failed to parse search history:', e);
      }
    }
  }, []);

  // 검색 기록 저장
  const saveSearchHistory = (server: string, nickname: string) => {
    const newItem: SearchHistory = {
      server,
      nickname,
      timestamp: Date.now(),
    };

    // 중복 제거 (같은 서버 + 닉네임)
    const filtered = searchHistory.filter(
      (item) => !(item.server === server && item.nickname === nickname)
    );

    // 최신 항목을 맨 앞에 추가 (최대 10개)
    const updated = [newItem, ...filtered].slice(0, 10);
    setSearchHistory(updated);
    localStorage.setItem('searchHistory', JSON.stringify(updated));
  };

  const handleSearch = async () => {
    if (!nickname.trim()) return;

    const serverId = getServerIdFromKorean(selectedServer);

    console.log('[검색 시작]', { selectedServer, nickname, serverId });

    try {
      // API 호출하여 캐릭터 존재 여부 확인
      const apiUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
        ? `http://${window.location.hostname}:8080`
        : 'http://localhost:8080';

      const url = `${apiUrl}/api/characters/search?serverId=${serverId}&characterName=${encodeURIComponent(nickname)}`;
      console.log('[API 호출]', url);

      const response = await fetch(url, { cache: 'no-store' });
      console.log('[API 응답 상태]', response.status, response.ok);

      // 404 에러는 캐릭터 없음
      if (response.status === 404) {
        console.log('[404 캐릭터 없음]');
        setModalMessage(`${selectedServer} 서버의 "${nickname}" 캐릭터를 찾을 수 없습니다.`);
        setShowModal(true);
        return;
      }

      // 200이 아니면 서버 오류
      if (!response.ok) {
        console.log('[서버 오류]', response.status);
        setModalMessage('검색 중 오류가 발생했습니다.');
        setShowModal(true);
        return;
      }

      // 정상 응답 - JSON 파싱
      let data;
      try {
        data = await response.json();
        console.log('[파싱된 데이터]', data);
      } catch (parseError) {
        console.error('[JSON 파싱 실패]', parseError);
        setModalMessage('검색 중 오류가 발생했습니다.');
        setShowModal(true);
        return;
      }

      // 캐릭터 존재 여부 확인
      const hasCharacters = (data.rows && Array.isArray(data.rows) && data.rows.length > 0) ||
                           (Array.isArray(data) && data.length > 0);

      console.log('[캐릭터 존재 여부]', hasCharacters, data);

      if (!hasCharacters) {
        console.log('[응답은 성공이지만 캐릭터 없음]');
        setModalMessage(`${selectedServer} 서버의 "${nickname}" 캐릭터를 찾을 수 없습니다.`);
        setShowModal(true);
        return;
      }

      // 캐릭터가 있으면 검색 기록 저장 후 페이지 이동
      console.log('[캐릭터 있음 - 페이지 이동]');
      saveSearchHistory(selectedServer, nickname);

      if (onSearch) {
        onSearch(serverId, nickname);
      } else {
        // onSearch prop이 없으면 직접 라우팅
        router.push(`/search?server=${encodeURIComponent(serverId)}&name=${encodeURIComponent(nickname)}`);
      }
    } catch (err) {
      console.error('[catch 블록 진입]', err);
      // 네트워크 오류 등
      setModalMessage(`${selectedServer} 서버의 "${nickname}" 캐릭터를 찾을 수 없습니다.`);
      setShowModal(true);
    }
  };

  // 검색 기록 클릭
  const handleHistoryClick = (item: SearchHistory, index: number) => {
    setSelectedServer(item.server);
    setNickname(item.nickname);
    setActiveTab(index);

    if (onSearch) {
      const serverId = getServerIdFromKorean(item.server);
      onSearch(serverId, item.nickname);
    }
  };

  // 개별 검색 기록 삭제
  const deleteHistoryItem = (index: number, e: React.MouseEvent) => {
    e.stopPropagation(); // 클릭 이벤트 전파 방지
    const updated = searchHistory.filter((_, i) => i !== index);
    setSearchHistory(updated);
    localStorage.setItem('searchHistory', JSON.stringify(updated));

    // 삭제된 항목이 활성 탭이었으면 초기화
    if (activeTab === index) {
      setActiveTab(null);
    }
  };

  // 전체 검색 기록 삭제
  const clearAllHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
    setActiveTab(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md mb-6 p-6">
      {/* 검색창 */}
      <div className="flex gap-3 mb-4">
        <select
          value={selectedServer}
          onChange={(e) => setSelectedServer(e.target.value)}
          className="px-4 py-3 bg-gray-100 border-none rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3DB89E]"
          style={{
            color: '#000000',
            fontWeight: '500'
          }}
        >
          {SERVER_LIST_KOREAN.map((server) => (
            <option key={server} style={{ color: '#000000' }}>{server}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="닉네임을 입력하세요"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 px-4 py-3 bg-gray-100 border-none rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3DB89E] placeholder-gray-900"
          style={{
            color: '#000000',
            fontWeight: '500'
          }}
        />
        <button
          onClick={handleSearch}
          className="px-8 py-3 text-white font-bold rounded-lg text-sm transition-all shadow-md hover:shadow-lg hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #00D4FF 0%, #155DFC 100%)'
          }}
        >
          검색
        </button>
      </div>

      {/* 검색 탭 */}
      <div className="border-b border-gray-200 pb-2">
        <div className="flex flex-wrap gap-4 items-start">
          <div className="px-4 py-2 text-sm font-medium text-gray-400 relative whitespace-nowrap">
            최근 검색
          </div>
          {searchHistory.length === 0 ? (
            <div className="px-4 py-2 text-sm text-gray-400">
              검색 기록이 없습니다
            </div>
          ) : (
            searchHistory.slice(0, 8).map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleHistoryClick(item, idx)}
                onMouseEnter={() => setHoveredTab(idx)}
                onMouseLeave={() => setHoveredTab(null)}
                className={`px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap flex items-center gap-2 group ${
                  activeTab === idx || hoveredTab === idx
                    ? 'text-[#3DB89E]'
                    : 'text-gray-500'
                }`}
              >
                <span>{item.server} · {item.nickname}</span>
                <svg
                  onClick={(e) => deleteHistoryItem(idx, e)}
                  className="w-3.5 h-3.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                {(activeTab === idx || hoveredTab === idx) && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ background: 'var(--primary)' }}
                  />
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* 검색 결과 모달 */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="검색 결과"
      >
        <div className="text-center py-4">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-gray-700 text-lg mb-6">{modalMessage}</p>
          <button
            onClick={() => setShowModal(false)}
            className="px-6 py-2 text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg"
            style={{ background: 'var(--primary)' }}
          >
            확인
          </button>
        </div>
      </Modal>
    </div>
  );
}
