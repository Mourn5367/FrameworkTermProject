'use client';

import Image from 'next/image';
import Footer from '@/components/layout/Footer';
import SearchSection from '@/components/search/SearchSection';
import CharacterInfoCard, { CharacterInfo } from '@/components/character/CharacterInfoCard';
import EquipmentAccordion, { EquipmentData } from '@/components/character/EquipmentAccordion';

export default function CharacterDetailPage() {
  const handleSearch = (server: string, nickname: string) => {
    console.log('검색:', server, nickname);
    // TODO: 캐릭터 검색 로직 구현
  };

  // 캐릭터 정보 데이터
  const characterData: CharacterInfo = {
    fame: 72500,
    nickname: '플레이어123',
    server: '카인',
    adventureName: '모험단명',
    guildName: '길드명',
    connectionTime: {
      hours: 6,
      period: '오후 6시 ~ 자정'
    },
    weeklyDungeons: [
      { name: '베누스', current: 1, max: 1 },
      { name: '나벨 레이드', current: 0, max: 0 },
      { name: '이내 황혼전', current: 0, max: 1 }
    ],
    currentWeekGrade: {
      legendary: 0,
      epic: 0,
      ancient: 0
    },
    lastWeekGrade: {
      legendary: 2,
      epic: 5,
      ancient: 1
    }
  };

  // 세트, 방어구, 무기 융합석 데이터
  const armorEquipmentSections: EquipmentData[] = [
    {
      title: '[검색 캐릭터 직업명] 선호 세트',
      items: [
        { name: '고대 던전의 발자취', percentage: 80 },
        { name: '그랴자의 숨은 목걸', percentage: 80 },
        { name: '미라의 영역', percentage: 80 },
        { name: '무인 사냥의 끝자락', percentage: 80 },
        { name: '새벽티타', percentage: 80 },
        { name: '소홀 페어리', percentage: 80 },
        { name: '암흑던전 저주', percentage: 80 },
        { name: '에테르의 오브 이즈', percentage: 80 },
        { name: '영원의 아이언하트 헬결판', percentage: 80 },
        { name: '투롱영의 난', percentage: 80 },
        { name: '컬트의 영문', percentage: 80 },
        { name: '한재를 담아낸다', percentage: 80 }
      ]
    },
    {
      title: '[검색 캐릭터 직업명] 방어구 융합석 조합',
      items: [
        { name: '기술 * 5, 청향 * 0, 메선 * 0', percentage: 80 },
        { name: '기술 * 4, 청향 * 1, 메선 * 0', percentage: 80 },
        { name: '기술 * 4, 청향 * 0, 메선 * 1', percentage: 80 },
        { name: '기술 * 3, 청향 * 2, 메선 * 0', percentage: 80 },
        { name: '기술 * 3, 청향 * 0, 메선 * 2', percentage: 80 },
        { name: '기술 * 3, 청향 * 1, 메선 * 1', percentage: 80 },
        { name: '기술 * 2, 청향 * 2, 메선 * 1', percentage: 80 },
        { name: '기술 * 2, 청향 * 1, 메선 * 2', percentage: 80 },
        { name: '기술 * 2, 청향 * 3, 메선 * 0', percentage: 80 },
        { name: '기술 * 1, 청향 * 4, 메선 * 0', percentage: 80 },
        { name: '기술 * 1, 청향 * 0, 메선 * 4', percentage: 80 },
        { name: '한재를 담아낸 에나딘다', percentage: 80 }
      ]
    },
    {
      title: '[검색 캐릭터 직업명] 무기 융합석',
      items: [
        { name: '기술', percentage: 80 },
        { name: '확장', percentage: 80 },
        { name: '배산', percentage: 80 },
        { name: '세트', percentage: 80 }
      ]
    }
  ];

  // 무기 레벨링 추가 컨텐츠
  const weaponLevelingContent = (
    <div className="mt-6 pt-4 border-t border-gray-200">
      <h4 className="text-xs font-bold text-gray-700 mb-2">[검색 캐릭터 직업명] 무기 레벨링</h4>
      <div className="space-y-2">
        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
          <span className="text-xs text-gray-700">세계권 빌리 기여</span>
          <span className="text-sm font-bold text-blue-600">80%</span>
        </div>
        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
          <span className="text-xs text-gray-700">세계권 헬파잉 기여</span>
          <span className="text-sm font-bold text-blue-600">80%</span>
        </div>
        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
          <span className="text-xs text-gray-700">세계권 융합석 기여</span>
          <span className="text-sm font-bold text-blue-600">80%</span>
        </div>
      </div>
      <div className="mt-6 pt-4 border-t border-gray-200">
      <h4 className="text-xs font-bold text-gray-700 mb-2">[검색 캐릭터 직업명] 칭호 레벨</h4>
      <div className="space-y-2">
        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
          <span className="text-xs text-gray-700">30 레벨</span>
          <span className="text-sm font-bold text-blue-600">80%</span>
        </div>
        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
          <span className="text-xs text-gray-700">35 레벨</span>
          <span className="text-sm font-bold text-blue-600">80%</span>
        </div>
        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
          <span className="text-xs text-gray-700">40 레벨</span>
          <span className="text-sm font-bold text-blue-600">80%</span>
        </div>
        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
          <span className="text-xs text-gray-700">45 레벨</span>
          <span className="text-sm font-bold text-blue-600">80%</span>
        </div>
        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
          <span className="text-xs text-gray-700">50 레벨</span>
          <span className="text-sm font-bold text-blue-600">80%</span>
        </div>
      </div>
    </div>
    </div>
    
  );
    // 칭호 레벨링
    const titleLevelingContent = (
    <div className="mt-6 pt-4 border-t border-gray-200">
      <h4 className="text-xs font-bold text-gray-700 mb-2">[검색 캐릭터 직업명] 칭호 레벨</h4>
      <div className="space-y-2">
        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
          <span className="text-xs text-gray-700">30 레벨</span>
          <span className="text-sm font-bold text-blue-600">80%</span>
        </div>
        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
          <span className="text-xs text-gray-700">35 레벨</span>
          <span className="text-sm font-bold text-blue-600">80%</span>
        </div>
        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
          <span className="text-xs text-gray-700">40 레벨</span>
          <span className="text-sm font-bold text-blue-600">80%</span>
        </div>
        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
          <span className="text-xs text-gray-700">45 레벨</span>
          <span className="text-sm font-bold text-blue-600">80%</span>
        </div>
        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
          <span className="text-xs text-gray-700">50 레벨</span>
          <span className="text-sm font-bold text-blue-600">80%</span>
        </div>
      </div>
    </div>
  );
  // 특수 융합석 조합 (팔찌)
  const specialWeaponContent = (
    <div className="mt-6 pt-4 border-t border-gray-200">
      <h4 className="text-xs font-bold text-gray-700 mb-2">[검색 캐릭터 직업명] 특수 융합석 조합</h4>
      <div className="space-y-2">
        {['35 * 3', '35 * 2, 80 * 1', '단·구간 * 3', '35 * 2, 전 구간', '80 * 3', '75 * 3', '40 * 3', '60 * 3', '무기 1'].map((item, idx) => (
          <div key={idx} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
            <span className="text-xs text-gray-700 font-medium">{item}</span>
            <span className="text-sm font-bold text-blue-600">80%</span>
          </div>
        ))}
      </div>
    </div>
  );

  // 특수 융합석 (목걸이)
  const specialArmorContent = (
    <div className="mt-6 pt-4 border-t border-gray-200">
      <h4 className="text-xs font-bold text-gray-700 mb-2">[검색 캐릭터 직업명] 특수 융합석</h4>
      <div className="space-y-2">
        {['35 레벨', '40 레벨', '45 레벨', '60 레벨', '70 레벨', '75레벨', '80 레벨', '전 구간', '세트'].map((item, idx) => (
          <div key={idx} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
            <span className="text-xs text-gray-700 font-medium">{item}</span>
            <span className="text-sm font-bold text-blue-600">80%</span>
          </div>
        ))}
      </div>
    </div>
  );

  // 악세 융합석 조합 (반지)
  const specialRingContent = (
    <div className="mt-6 pt-4 border-t border-gray-200">
      <h4 className="text-xs font-bold text-gray-700 mb-2">[검색 캐릭터 직업명] 악세 융합석 조합</h4>
      <div className="space-y-2">
        {['35 * 3', '35 * 2, 80 * 1', '단·구간 * 3', '35 * 2, 전 구간', '80 * 3', '75 * 3', '40 * 3', '60 * 3', '무기 1'].map((item, idx) => (
          <div key={idx} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
            <span className="text-xs text-gray-700 font-medium">{item}</span>
            <span className="text-sm font-bold text-blue-600">80%</span>
          </div>
        ))}
      </div>
    </div>
  );

  // 악세, 특장 융합석 데이터
  const accessoryEquipmentSections: EquipmentData[] = [
    {
      title: '[검색 캐릭터 직업명] 팔찌 융합석',
      items: [
        { name: '국역', percentage: 80 },
        { name: '무지', percentage: 80 },
        { name: '양조', percentage: 80 },
        { name: '태어나', percentage: 80 }
      ],
      additionalContent: specialWeaponContent
    },
    {
      title: '[검색 캐릭터 직업명] 목걸이 융합석',
      items: [
        { name: '국역', percentage: 80 },
        { name: '무지', percentage: 80 },
        { name: '양조', percentage: 80 },
        { name: '태어나', percentage: 80 }
      ],
      additionalContent: specialArmorContent
    },
    {
      title: '[검색 캐릭터 직업명] 반지 융합석',
      items: [
        { name: '국역', percentage: 80 },
        { name: '무지', percentage: 80 },
        { name: '양조', percentage: 80 },
        { name: '태어나', percentage: 80 }
      ],
      additionalContent: specialRingContent
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

          {/* 캐릭터 정보 카드 */}
          <CharacterInfoCard character={characterData} />

          {/* 세트, 방어구, 무기 융합석 아코디언 */}
          <EquipmentAccordion
            title="세트, 방어구, 무기 융합석"
            headerColor="var(--secondary-blue)"
            accentColor="#2563eb"
            sections={armorEquipmentSections}
            additionalContent={weaponLevelingContent}
          />

          {/* 악세, 특장 융합석 아코디언 */}
          <EquipmentAccordion
            title="악세, 특장 융합석"
            headerColor="var(--secondary-purple)"
            accentColor="#2563eb"
            sections={[
              {
                ...accessoryEquipmentSections[0],
                items: accessoryEquipmentSections[0].items
              },
              {
                ...accessoryEquipmentSections[1],
                items: accessoryEquipmentSections[1].items
              },
              {
                ...accessoryEquipmentSections[2],
                items: accessoryEquipmentSections[2].items
              }
            ]}
            additionalContent={
              <>
                {/* 각 섹션에 특수/악세 융합석을 추가 */}
                <style jsx>{`
                  :global(.equipment-section-0) { }
                `}</style>
              </>
            }
          />
        </div>
      </div>

      <Footer />
    </div>
  );
}
