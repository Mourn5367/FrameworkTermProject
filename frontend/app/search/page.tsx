'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SearchSection from '@/components/search/SearchSection';
import Footer from '@/components/layout/Footer';

interface Character {
  serverId: string;
  characterId: string;
  characterName: string;
  level: number;
  jobName: string;
  jobGrowName: string;
  adventureName?: string;
  guildName?: string;
  fame?: number;
}

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const server = searchParams.get('server');
  const name = searchParams.get('name');

  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 재검색 핸들러
  const handleSearch = (newServer: string, newNickname: string) => {
    router.push(`/search?server=${encodeURIComponent(newServer)}&name=${encodeURIComponent(newNickname)}`);
  };

  useEffect(() => {
    if (!server || !name) {
      setError('서버와 닉네임을 입력해주세요.');
      setLoading(false);
      return;
    }

    async function searchCharacters() {
      try {
        setLoading(true);
        setError(null);

        const apiUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
          ? `http://${window.location.hostname}:8080`
          : 'http://localhost:8080';
        const response = await fetch(
          `${apiUrl}/api/characters/search?serverId=${server}&characterName=${encodeURIComponent(name)}`,
          { cache: 'no-store' }
        );

        if (!response.ok) {
          throw new Error('검색에 실패했습니다.');
        }

        const data = await response.json();

        // API 응답 구조에 따라 처리
        if (data.rows && Array.isArray(data.rows)) {
          setCharacters(data.rows);
        } else if (Array.isArray(data)) {
          setCharacters(data);
        } else {
          setCharacters([]);
        }
      } catch (err) {
        console.error('Search error:', err);
        setError('캐릭터를 찾을 수 없습니다.');
      } finally {
        setLoading(false);
      }
    }

    searchCharacters();
  }, [server, name]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600">검색 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:opacity-90"
          >
            메인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ background: 'var(--background)' }}>
      <div className="flex-1">
        <div className="app-container py-8">
          {/* 로고 */}
          <div className="text-center mb-6">
            <Link href="/">
              <Image
                src="/images/logo.png"
                alt="DunSight"
                width={300}
                height={80}
                className="mx-auto cursor-pointer"
                priority
              />
            </Link>
          </div>

          {/* 검색 섹션 */}
          <SearchSection onSearch={handleSearch} />

          {/* 캐릭터 카드 그리드 */}
          {characters.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-md">
              <p className="text-gray-600 text-lg mb-4">검색 결과가 없습니다.</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {characters.map((character) => (
              <Link
                key={character.characterId}
                href={`/characters/${character.serverId}/${character.characterId}`}
                className="block"
              >
                <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer border-2 border-transparent hover:border-primary">
                  {/* 캐릭터 이미지 */}
                  <div className="relative w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600">
                    <img
                      src={`https://img-api.neople.co.kr/df/servers/${character.serverId}/characters/${character.characterId}?zoom=1`}
                      alt={character.characterName}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-3 right-3 bg-primary text-white px-3 py-1 rounded-full text-xs font-medium">
                      {character.serverId}
                    </div>
                  </div>

                  {/* 카드 정보 */}
                  <div className="p-4">
                    {/* 캐릭터 이름 */}
                    <div className="mb-3">
                      <h3 className="text-lg font-bold text-gray-800">
                        {character.characterName}
                      </h3>
                    </div>

                    {/* 직업 정보 */}
                    <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600">{character.jobName}</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {character.jobGrowName}
                      </p>
                    </div>

                    {/* 추가 정보 */}
                    <div className="space-y-2 text-xs mb-3">
                      {/* 명성 */}
                      {character.fame !== undefined && character.fame !== null && (
                        <div className="flex items-center justify-between p-2 bg-yellow-50 rounded border border-yellow-200">
                          <div className="flex items-center text-yellow-700">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="font-medium">명성</span>
                          </div>
                          <span className="font-bold text-yellow-800">
                            {character.fame.toLocaleString()}
                          </span>
                        </div>
                      )}

                      {/* 모험단 */}
                      {character.adventureName && (
                        <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                          <div className="flex items-center text-blue-700">
                            <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span className="font-medium">모험단</span>
                          </div>
                          <span className="font-semibold text-blue-800 truncate ml-2">
                            {character.adventureName}
                          </span>
                        </div>
                      )}

                      {/* 길드 */}
                      {character.guildName && (
                        <div className="flex items-center justify-between p-2 bg-purple-50 rounded border border-purple-200">
                          <div className="flex items-center text-purple-700">
                            <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="font-medium">소속 길드</span>
                          </div>
                          <span className="font-semibold text-purple-800 truncate ml-2">
                            {character.guildName}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 클릭 유도 */}
                    <div className="pt-3 border-t border-gray-200 flex justify-end">
                      <span className="text-primary text-xs font-medium flex items-center">
                        자세히 보기
                        <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        </div>
      </div>

      {/* 푸터 */}
      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <SearchResults />
    </Suspense>
  );
}
