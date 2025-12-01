'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ItemSearchResult {
  itemId: string;
  itemName: string;
  itemRarity: string;
  itemType: string;
  itemAvailableLevel: number;
  itemExplain?: string;
}

interface TrackedItem {
  id: number;
  itemId: string;
  itemName: string;
  addedAt: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ItemSearchResult[]>([]);
  const [trackedItems, setTrackedItems] = useState<TrackedItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // API URL (클라이언트에서만 사용)
  const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? `http://${window.location.hostname}:8080`
    : 'http://localhost:8080';

  // 추적 아이템 목록 로드
  const loadTrackedItems = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auction/tracked-items`);
      if (res.ok) {
        const data = await res.json();
        setTrackedItems(data);
      }
    } catch (error) {
      console.error('추적 아이템 로드 실패:', error);
    }
  };

  // 페이지 로드 시 추적 아이템 목록 가져오기
  useEffect(() => {
    loadTrackedItems();
  }, []);

  // 아이템 검색
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setMessage('검색어를 입력하세요.');
      return;
    }

    setIsSearching(true);
    setMessage('');

    try {
      const res = await fetch(
        `${API_URL}/api/auction/admin/search-items?itemName=${encodeURIComponent(searchQuery)}`
      );

      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.rows || []);
        if (!data.rows || data.rows.length === 0) {
          setMessage('검색 결과가 없습니다.');
        }
      } else {
        setMessage('검색 실패');
      }
    } catch (error) {
      console.error('검색 실패:', error);
      setMessage('검색 중 오류 발생');
    } finally {
      setIsSearching(false);
    }
  };

  // 아이템 추가
  const handleAddItem = async (item: ItemSearchResult) => {
    setIsLoading(true);
    setMessage('');

    try {
      const res = await fetch(`${API_URL}/api/auction/tracked-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.itemId,
          itemName: item.itemName,
          itemImageUrl: `https://img-api.neople.co.kr/df/items/${item.itemId}`,
        }),
      });

      if (res.ok) {
        setMessage(`✅ "${item.itemName}" 추가 완료!`);
        await loadTrackedItems();
        setSearchResults([]);
        setSearchQuery('');
      } else if (res.status === 400) {
        setMessage('⚠️ 이미 추가된 아이템입니다.');
      } else {
        setMessage('❌ 추가 실패');
      }
    } catch (error) {
      console.error('아이템 추가 실패:', error);
      setMessage('❌ 추가 중 오류 발생');
    } finally {
      setIsLoading(false);
    }
  };

  // 아이템 삭제
  const handleDeleteItem = async (id: number, itemName: string) => {
    if (!confirm(`"${itemName}"을(를) 삭제하시겠습니까?`)) return;

    setIsLoading(true);
    setMessage('');

    try {
      const res = await fetch(`${API_URL}/api/auction/tracked-items/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMessage(`✅ "${itemName}" 삭제 완료!`);
        await loadTrackedItems();
      } else {
        setMessage('❌ 삭제 실패');
      }
    } catch (error) {
      console.error('아이템 삭제 실패:', error);
      setMessage('❌ 삭제 중 오류 발생');
    } finally {
      setIsLoading(false);
    }
  };

  // 등급별 색상
  const getRarityColor = (rarity: string) => {
    const colors: { [key: string]: string } = {
      커먼: '#CCCCCC',
      언커먼: '#00FF00',
      레어: '#0080FF',
      유니크: '#FF00FF',
      에픽: '#FFA500',
      크로니클: '#FFFF00',
      레전더리: '#FF6600',
      신화: '#FF0000',
    };
    return colors[rarity] || '#FFFFFF';
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: 'var(--font-size-3xl)', marginBottom: '2rem', color: 'var(--primary)' }}>
        📊 관리자 - 추적 아이템 관리
      </h1>

      {/* 메시지 표시 */}
      {message && (
        <div
          style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            background: message.includes('✅') ? '#d4edda' : message.includes('⚠️') ? '#fff3cd' : '#f8d7da',
            border: `1px solid ${message.includes('✅') ? '#c3e6cb' : message.includes('⚠️') ? '#ffeaa7' : '#f5c6cb'}`,
            borderRadius: '8px',
            color: message.includes('✅') ? '#155724' : message.includes('⚠️') ? '#856404' : '#721c24',
          }}
        >
          {message}
        </div>
      )}

      {/* 아이템 검색 */}
      <div
        style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '2rem',
        }}
      >
        <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: '1rem' }}>🔍 아이템 검색</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="아이템 이름 입력..."
            style={{
              flex: 1,
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: 'var(--font-size-base)',
            }}
            disabled={isSearching || isLoading}
          />
          <button
            onClick={handleSearch}
            disabled={isSearching || isLoading}
            style={{
              padding: '0.75rem 2rem',
              background: isSearching || isLoading ? '#ccc' : 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isSearching || isLoading ? 'not-allowed' : 'pointer',
              fontSize: 'var(--font-size-base)',
              fontWeight: 'bold',
            }}
          >
            {isSearching ? '검색 중...' : '검색'}
          </button>
        </div>

        {/* 검색 결과 */}
        {searchResults.length > 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: '1rem' }}>
              검색 결과 ({searchResults.length}개)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {searchResults.map((item) => (
                <div
                  key={item.itemId}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '1rem',
                    background: '#f9f9f9',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <img
                      src={`https://img-api.neople.co.kr/df/items/${item.itemId}`}
                      alt={item.itemName}
                      style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', color: getRarityColor(item.itemRarity) }}>
                        {item.itemName}
                      </div>
                      <div style={{ fontSize: 'var(--font-size-sm)', color: '#666' }}>
                        Lv.{item.itemAvailableLevel} · {item.itemType}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddItem(item)}
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: isLoading ? '#ccc' : 'var(--secondary-blue)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'bold',
                    }}
                  >
                    + 추적 목록에 추가
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 추적 중인 아이템 목록 */}
      <div
        style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: '1rem' }}>
          📌 추적 중인 아이템 ({trackedItems.length}개)
        </h2>
        {trackedItems.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>추적 중인 아이템이 없습니다.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {trackedItems.map((item) => (
              <div
                key={item.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '1rem',
                  background: '#f9f9f9',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <img
                    src={`https://img-api.neople.co.kr/df/items/${item.itemId}`}
                    alt={item.itemName}
                    style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold' }}>{item.itemName}</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: '#666' }}>
                      추가일: {new Date(item.addedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteItem(item.id, item.itemName)}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: isLoading ? '#ccc' : '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'bold',
                  }}
                >
                  🗑️ 삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 뒤로 가기 버튼 */}
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button
          onClick={() => router.push('/')}
          style={{
            padding: '0.75rem 2rem',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: 'var(--font-size-base)',
          }}
        >
          ← 메인으로 돌아가기
        </button>
      </div>
    </div>
  );
}
