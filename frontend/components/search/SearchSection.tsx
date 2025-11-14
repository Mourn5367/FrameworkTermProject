'use client';

import { useState } from 'react';

interface SearchSectionProps {
  onSearch?: (server: string, nickname: string) => void;
}

export default function SearchSection({ onSearch }: SearchSectionProps) {
  const [selectedServer, setSelectedServer] = useState('카인 서버');
  const [nickname, setNickname] = useState('');
  const [activeTab, setActiveTab] = useState<string>('nickname1');

  const recentSearches = ['닉네임 1', '닉네임 2', '닉네임 3', '닉네임 4'];

  const servers = [
    '카인',
    '디레지에',
    '시로코',
    '프레이',
    '카시야스',
    '힐더',
    '안톤',
    '바칼'
  ];

  const handleSearch = () => {
    if (onSearch) {
      onSearch(selectedServer, nickname);
    }
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
          {servers.map((server) => (
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
      <div className="flex gap-4 border-b border-gray-200">
        <div
          className="px-4 py-2 text-sm font-medium text-gray-400 relative"
        >
          최근 검색
        </div>
        {recentSearches.map((name, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(name)}
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${
              activeTab === name
                ? 'text-[#3DB89E]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {name}
            {activeTab === name && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ background: 'var(--primary)' }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
