'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Footer from '@/components/layout/Footer';
import SearchSection from '@/components/search/SearchSection';
import CharacterInfoCard, { CharacterInfo } from '@/components/character/CharacterInfoCard';
import EquipmentStatsSection from '@/components/character/EquipmentStatsSection';
import { getServerNameKorean } from '@/utils/serverMapping';

interface PageProps {
  params: Promise<{
    serverId: string;
    characterId: string;
  }>;
}

export default function CharacterDetailPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { serverId, characterId } = resolvedParams;

  const [characterData, setCharacterData] = useState<CharacterInfo | null>(null);
  const [jobId, setJobId] = useState<string>('');
  const [jobGrowId, setJobGrowId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = (server: string, nickname: string) => {
    router.push(`/search?server=${encodeURIComponent(server)}&name=${encodeURIComponent(nickname)}`);
  };

  useEffect(() => {
    async function fetchCharacterData() {
      try {
        setLoading(true);
        setError(null);

        const apiUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
          ? `http://${window.location.hostname}:8080`
          : 'http://localhost:8080';

        // 캐릭터 기본 정보 조회
        const basicResponse = await fetch(
          `${apiUrl}/api/characters/${serverId}/${characterId}/basic`,
          { cache: 'no-store' }
        );

        if (!basicResponse.ok) {
          throw new Error('캐릭터 정보를 가져올 수 없습니다.');
        }

        const basicData = await basicResponse.json();

        // 주간 던전 현황 조회
        const dungeonResponse = await fetch(
          `${apiUrl}/api/characters/${serverId}/${characterId}/weekly-dungeons`,
          { cache: 'no-store' }
        );

        const dungeonData = dungeonResponse.ok ? await dungeonResponse.json() : null;

        // 접속 시간대 조회
        const playtimeResponse = await fetch(
          `${apiUrl}/api/characters/${serverId}/${characterId}/playtime`,
          { cache: 'no-store' }
        );

        const playtimeData = playtimeResponse.ok ? await playtimeResponse.json() : null;

        // 직업 정보 저장
        setJobId(basicData.jobId);
        setJobGrowId(basicData.jobGrowId);

        // 주간 던전 데이터 변환
        const weeklyDungeons = dungeonData?.dungeons || [];

        // 접속 시간대 계산 (가장 활발한 시간대)
        const calculateMostActiveTime = (playtimeData: any) => {
          if (!playtimeData) return { hours: 0, weekdayRange: '', weekendRange: '' };

          const weekdayRange = playtimeData.mostActiveWeekdayTimeRange || '';
          const weekendRange = playtimeData.mostActiveWeekendTimeRange || '';

          // 시간대 문자열에서 첫 번째 숫자 추출 (예: "21-24" -> 21)
          const parseHour = (range: string) => {
            const match = range.match(/^(\d+)/);
            return match ? parseInt(match[1]) : 0;
          };

          const hour = parseHour(weekdayRange);

          return {
            hours: hour,
            weekdayRange: weekdayRange,
            weekendRange: weekendRange
          };
        };

        // CharacterInfo 형식으로 변환
        const characterInfo: CharacterInfo = {
          characterId: characterId,
          serverId: serverId,
          characterName: basicData.characterName,
          jobName: basicData.jobName,
          jobGrowName: basicData.jobGrowName,
          level: basicData.level,
          fame: basicData.fame || 0,
          nickname: basicData.characterName,
          server: getServerNameKorean(serverId),
          adventureName: basicData.adventureName || '-',
          guildName: basicData.guildName || '-',
          connectionTime: calculateMostActiveTime(playtimeData),
          weeklyDungeons: weeklyDungeons,
          currentWeekGrade: {
            legendary: dungeonData?.thisWeekItemsByGrade?.['레전더리'] || 0,
            epic: dungeonData?.thisWeekItemsByGrade?.['에픽'] || 0,
            ancient: dungeonData?.thisWeekItemsByGrade?.['태초'] || 0
          },
          lastWeekGrade: {
            legendary: dungeonData?.lastWeekItemsByGrade?.['레전더리'] || 0,
            epic: dungeonData?.lastWeekItemsByGrade?.['에픽'] || 0,
            ancient: dungeonData?.lastWeekItemsByGrade?.['태초'] || 0
          }
        };

        setCharacterData(characterInfo);

      } catch (err) {
        console.error('Character data fetch error:', err);
        setError('캐릭터 정보를 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    }

    if (serverId && characterId) {
      fetchCharacterData();
    }
  }, [serverId, characterId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600">캐릭터 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !characterData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || '캐릭터를 찾을 수 없습니다.'}</p>
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

          {/* 캐릭터 정보 카드 */}
          <CharacterInfoCard character={characterData} />

          {/* 장비 통계 섹션 (해당 캐릭터의 직업 통계) */}
          {jobId && jobGrowId && (
            <EquipmentStatsSection
              jobId={jobId}
              jobGrowId={jobGrowId}
            />
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
