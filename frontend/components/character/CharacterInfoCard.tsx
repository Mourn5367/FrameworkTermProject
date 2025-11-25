'use client';

import Image from 'next/image';

export interface CharacterInfo {
  characterId: string;
  serverId: string;
  characterName: string;
  jobName: string;
  jobGrowName: string;
  level: number;
  fame: number;
  nickname: string;
  server: string;
  adventureName: string;
  guildName: string;
  connectionTime: {
    hours: number;
    weekdayRange: string;
    weekendRange: string;
  };
  weeklyDungeons: {
    name: string;
    cleared: boolean;
    count: number;
  }[];
  currentWeekGrade: {
    legendary: number;
    epic: number;
    ancient: number;
  };
  lastWeekGrade: {
    legendary: number;
    epic: number;
    ancient: number;
  };
}

interface CharacterInfoCardProps {
  character: CharacterInfo;
  title?: string;
  headerColor?: string;
  accentColor?: string;
}

export default function CharacterInfoCard({
  character,
  title = '캐릭터 정보',
  headerColor = 'var(--primary)',
  accentColor = 'var(--primary)'
}: CharacterInfoCardProps) {

  return (
    <div className="bg-white rounded-xl shadow-md mb-6 overflow-hidden">
      <div className="px-6 py-4" style={{ background: headerColor }}>
        <h2 className="text-lg font-bold text-white">{title}</h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 1열: 캐릭터 사진 + 직업 정보 (7:3) */}
          <div className="flex flex-col gap-3">
            {/* 캐릭터 사진 (7) */}
            <div
              className="rounded-xl flex items-center justify-center overflow-hidden relative"
              style={{
                flex: 'var(--character-photo-ratio)',
                backgroundImage: 'url(https://bbscdn.df.nexon.com/data7/showroom/static/img/bg3.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <img
                src={`https://img-api.neople.co.kr/df/servers/${character.serverId}/characters/${character.characterId}?zoom=1`}
                alt={character.characterName}
                className="w-full h-full object-contain relative z-10"
              />
            </div>

            {/* 직업 정보 (3) */}
            <div
              className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center overflow-hidden p-4"
              style={{ flex: 'var(--job-illustration-ratio)' }}
            >
              <div className="text-center w-full">
                <p className="text-xs text-white opacity-90 mb-1">{character.jobName}</p>
                <p className="text-sm font-bold text-white">{character.jobGrowName}</p>
                <p className="text-xs text-white opacity-90 mt-1">Lv. {character.level}</p>
              </div>
            </div>
          </div>

          {/* 2열: 명성 + 닉네임/서버/모험단/길드 + 접속시간대 */}
          <div className="flex flex-col">
            {/* 상단 영역: 명성 + 기본 정보 */}
            <div className="flex-1 space-y-3">
              {/* 명성 */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Image src="/images/fame-icon.png" alt="명성" width={24} height={24} />
                  <h3 className="text-3xl font-black" style={{ color: accentColor }}>
                    {character.fame.toLocaleString()}
                  </h3>
                </div>
              </div>

              {/* 기본 정보 */}
              <div className="space-y-1">
                <div>
                  <p className="text-xs text-gray-500 mb-1">캐릭터명</p>
                  <p className="text-base font-bold text-gray-800">{character.characterName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">서버명</p>
                  <p className="text-base font-medium text-gray-800">{character.server}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">모험단명</p>
                  <p className="text-base font-medium text-gray-800">{character.adventureName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">길드명</p>
                  <p className="text-base font-medium text-gray-800">{character.guildName}</p>
                </div>
              </div>
            </div>

            {/* 접속 시간대 - 직업 일러스트와 높이 맞춤 */}
            <div
              className="flex flex-col justify-end"
              style={{ flex: 'var(--job-illustration-ratio)' }}
            >
              <h4 className="text-sm font-bold text-gray-700 mb-3 mt-3">접속 시간대</h4>
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 flex-shrink-0">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={accentColor}
                      strokeWidth="8"
                      strokeDasharray="62.83 188.5"
                      strokeDashoffset="62.83"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {character.connectionTime.weekdayRange && (
                      <p className="text-xs font-bold text-green-600">
                        {character.connectionTime.weekdayRange}시
                      </p>
                    )}
                    {character.connectionTime.weekendRange && (
                      <p className="text-xs font-bold text-red-600">
                        {character.connectionTime.weekendRange}시
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1 font-medium">주요 활동 시간</p>
                  <div className="space-y-1">
                    {character.connectionTime.weekdayRange && (
                      <p className="text-sm text-gray-700">
                        평일: {character.connectionTime.weekdayRange.replace('-', '시 ~ ')}시
                      </p>
                    )}
                    {character.connectionTime.weekendRange && (
                      <p className="text-sm text-red-600">
                        주말: {character.connectionTime.weekendRange.replace('-', '시 ~ ')}시
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3열: 주간 던전 목록 */}
          <div className="flex flex-col h-full">
            <div className="bg-gray-50 rounded-xl p-5 flex flex-col h-full">
              <h4 className="text-base font-bold text-gray-800 mb-4">주간 던전 목록</h4>

              <div className="space-y-3 mb-auto">
                {character.weeklyDungeons.map((dungeon, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-base text-gray-700">{dungeon.name}</span>
                    <span
                      className={`text-base font-bold ${
                        dungeon.cleared ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {dungeon.cleared ? '클리어' : '미클리어'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-200 mt-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-bold">금주 먹은 등급:</span><br />
                    레전더리: {character.currentWeekGrade.legendary}개 | 에픽: {character.currentWeekGrade.epic}개 | 태초: {character.currentWeekGrade.ancient}개
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-bold">전주 먹은 등급:</span><br />
                    레전더리: {character.lastWeekGrade.legendary}개 | 에픽: {character.lastWeekGrade.epic}개 | 태초: {character.lastWeekGrade.ancient}개
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
