'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const CRAWLER_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? `http://${window.location.hostname}:8000`
  : 'http://localhost:8000';

interface WordCloudMetadata {
  board_id: string;
  top_words: [string, number][];
  total_posts: number;
  generated_at: string;
}

export default function WordCloudWidget() {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [metadata, setMetadata] = useState<WordCloudMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // 워드클라우드 로드
  const loadWordCloud = async () => {
    try {
      setLoading(true);
      setError(null);

      // 메타데이터 로드
      const metaRes = await fetch(`${CRAWLER_URL}/api/wordcloud/dfip/metadata`, {
        cache: 'no-store' // 캐시 사용 안함
      });
      if (metaRes.ok) {
        const metaData = await metaRes.json();
        setMetadata(metaData);
      }

      // 이미지 URL 설정 (timestamp로 캐시 무효화)
      const timestamp = new Date().getTime();
      setImageUrl(`${CRAWLER_URL}/api/wordcloud/dfip?t=${timestamp}`);

      // 현재 시간을 문자열로 저장
      const now = new Date();
      setLastUpdate(now.toLocaleTimeString('ko-KR'));
    } catch (err) {
      console.error('Failed to load wordcloud:', err);
      setError('워드클라우드를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    loadWordCloud();
  }, []);

  // 1분마다 자동 갱신
  useEffect(() => {
    const interval = setInterval(() => {
      loadWordCloud();
    }, 60000); // 60초

    return () => clearInterval(interval);
  }, []);

  // 수동 새로고침
  const handleRefresh = () => {
    loadWordCloud();
  };

  const formatDate = (dateStr: string) => {
    // MongoDB에 KST 시간이 naive datetime으로 저장됨 (timezone 정보 없음)
    // 그대로 파싱하면 로컬 시간대로 해석되므로, 직접 한국 시간으로 표시
    const date = new Date(dateStr);
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md mb-6 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'var(--primary)' }}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
              />
            </svg>
          </div>

        <div>
            <h3 className="text-xl font-bold text-gray-800">던파 IP 갤러리 워드클라우드</h3>
            <p className="text-sm text-gray-500">
                {metadata ?
                    `제작 시간 : ${formatDate(metadata.generated_at)} / ${metadata.total_posts}개 게시글 분석`
                    : '로딩 중...'}
            </p>
        </div>
        </div>

        {/* 새로고침 버튼 */}
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          title="새로고침"
        >
          <svg
            className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* 워드클라우드 이미지 */}
      {loading && !imageUrl ? (
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-3"></div>
            <p className="text-gray-600">워드클라우드 생성 중...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg">
          <div className="text-center text-red-600">
            <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p>{error}</p>
            <p className="text-sm mt-2">크롤링이 완료될 때까지 기다려주세요.</p>
          </div>
        </div>
      ) : (
        <div className="relative group">
          {/* 워드클라우드 이미지 */}
          <img
            src={imageUrl}
            alt="워드클라우드"
            className="w-full h-auto rounded-lg shadow-sm transition-opacity duration-1500 ease-in-out group-hover:opacity-0"
            onError={() => setError('이미지를 불러올 수 없습니다.')}
          />

          {/* 원본 디레지에 이미지 (hover 시 표시) */}
          <img
            src="/images/dire_ori.png"
            alt="디레지에 원본"
            className="absolute top-0 left-0 w-full h-auto rounded-lg shadow-sm opacity-0 transition-opacity duration-700 ease-in-out group-hover:opacity-100"
          />
        </div>
      )}

      {/* Top 10 단어 */}
      {metadata && metadata.top_words && metadata.top_words.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Top 10 키워드</h4>
          <div className="flex flex-wrap gap-2">
            {metadata.top_words.slice(0, 10).map(([word, count], index) => (
              <div
                key={word}
                className="px-3 py-1 rounded-full text-sm"
                style={{
                  background: index < 3 ? 'var(--primary)' : '#E5E7EB',
                  color: index < 3 ? 'white' : '#374151'
                }}
              >
                {word} 
                {/* ({count}) */}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 자동 갱신 안내 */}
      {lastUpdate && (
        <p className="text-center text-gray-500 text-xs mt-4">
          1분마다 자동으로 갱신됩니다 · 마지막 갱신: {lastUpdate}
        </p>
      )}
    </div>
  );
}
