'use client';

import { useState, useEffect } from 'react';
import { getEquipmentStats, JobEquipmentStats, ItemStat, CombinationStat } from '@/lib/api/equipmentStats';
import EquipmentAccordion, { EquipmentData } from './EquipmentAccordion';
import SkillGaugeAccordion from './SkillGaugeAccordion';
import SkillCombinationAccordion from './SkillCombinationAccordion';

interface EquipmentStatsSectionProps {
  jobId: string;
  jobGrowId: string;
}

export default function EquipmentStatsSection({ jobId, jobGrowId }: EquipmentStatsSectionProps) {
  const [stats, setStats] = useState<JobEquipmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        setError(null);
        const data = await getEquipmentStats(jobId, jobGrowId);
        setStats(data);
      } catch (err) {
        console.error('장비 통계 로딩 실패:', err);
        setError('장비 통계를 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    }

    if (jobId && jobGrowId) {
      fetchStats();
    }
  }, [jobId, jobGrowId]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-4 text-sm text-gray-600">통계 데이터 로딩 중...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-red-600">{error || '통계 데이터를 찾을 수 없습니다.'}</p>
      </div>
    );
  }

  // ItemStat을 EquipmentData의 items 형식으로 변환
  const toEquipmentItems = (items: ItemStat[], minItems?: number) => {
    const result = items.map(item => ({
      name: item.itemName,
      percentage: Math.round(item.percentage * 10) / 10, // 소수점 1자리
    }));

    // 최소 개수 보장 (빈 공간으로 채우기)
    if (minItems && result.length < minItems) {
      const emptyCount = minItems - result.length;
      for (let i = 0; i < emptyCount; i++) {
        result.push({ name: '', percentage: 0 });
      }
    }

    return result;
  };

  // CombinationStat을 EquipmentData의 items 형식으로 변환
  const toCombinationItems = (combinations: CombinationStat[]) => {
    return combinations.map(combo => ({
      name: combo.combination,
      percentage: Math.round(combo.percentage * 10) / 10,
    }));
  };

  // 세트, 방어구, 무기 융합석 데이터
  const armorEquipmentSections: EquipmentData[] = [
    {
      title: `[${stats.jobGrowName}] 선호 세트`,
      items: toEquipmentItems(stats.setItems.slice(0, 10)),
    },
    {
      title: `[${stats.jobGrowName}] 방어구 융합석 조합`,
      items: toCombinationItems(stats.armorSetCombinations.slice(0, 10)),
    },
    {
      title: `[${stats.jobGrowName}] 방어구 융합석`,
      items: toEquipmentItems(stats.jacketUpgrades.slice(0, 10)),
    },
  ];

  // 무기 해방 (실제 데이터)
  const weaponTuneContent = (
    <div className="mt-6 pt-4 border-t border-gray-200">
      <h4 className="text-xs font-bold text-gray-700 mb-2">[{stats.jobGrowName}] 무기 해방</h4>
      <div className="space-y-2">
        {stats.weaponTunes.slice(0, 10).map((tune, idx) => (
          <div key={idx} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
            <span className="text-xs text-gray-700">{tune.itemName}</span>
            <span className="text-sm font-bold text-blue-600">{Math.round(tune.percentage * 10) / 10}%</span>
          </div>
        ))}
      </div>
    </div>
  );

  // 칭호 레벨 (숫자 추출)
  const extractTitleLevel = (itemName: string): number | null => {
    const match = itemName.match(/\d+/);
    return match ? parseInt(match[0]) : null;
  };

  const titleLevelContent = (() => {
    // 칭호에서 레벨 추출 및 그룹화
    const levelMap = new Map<number, number>();

    stats.titles.forEach(title => {
      const level = extractTitleLevel(title.itemName);
      if (level !== null) {
        levelMap.set(level, (levelMap.get(level) || 0) + title.percentage);
      }
    });

    // 레벨별로 정렬
    const sortedLevels = Array.from(levelMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return (
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-xs font-bold text-gray-700 mb-2">[{stats.jobGrowName}] 칭호 레벨</h4>
        <div className="space-y-2">
          {sortedLevels.map(([level, percentage], idx) => (
            <div key={idx} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
              <span className="text-xs text-gray-700">{level} 레벨</span>
              <span className="text-sm font-bold text-blue-600">{Math.round(percentage * 10) / 10}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  })();

  // 악세서리 융합석 조합
  const accessoryCombinationContent = (
    <div className="mt-6 pt-4 border-t border-gray-200">
      <h4 className="text-xs font-bold text-gray-700 mb-2">[{stats.jobGrowName}] 악세서리 융합석 조합</h4>
      <div className="space-y-2">
        {stats.accessoryCombinations.slice(0, 10).map((combo, idx) => (
          <div key={idx} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
            <span className="text-xs text-gray-700 font-medium">{combo.combination}</span>
            <span className="text-sm font-bold text-blue-600">{Math.round(combo.percentage * 10) / 10}%</span>
          </div>
        ))}
      </div>
    </div>
  );

  // 특수장비 융합석 조합
  const specialEquipmentCombinationContent = (
    <div className="mt-6 pt-4 border-t border-gray-200">
      <h4 className="text-xs font-bold text-gray-700 mb-2">[{stats.jobGrowName}] 특수장비 융합석 조합</h4>
      <div className="space-y-2">
        {stats.specialEquipmentCombinations.slice(0, 10).map((combo, idx) => (
          <div key={idx} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
            <span className="text-xs text-gray-700 font-medium">{combo.combination}</span>
            <span className="text-sm font-bold text-blue-600">{Math.round(combo.percentage * 10) / 10}%</span>
          </div>
        ))}
      </div>
    </div>
  );

  // 악세, 특장 융합석 데이터 (3단 그리드)
  const accessoryEquipmentSections: EquipmentData[] = [
    {
      title: `[${stats.jobGrowName}] 목걸이 융합석`,
      items: toEquipmentItems(stats.necklaceUpgrades.slice(0, 10), 3), // 최소 3개 공간
      additionalContent: accessoryCombinationContent, // 악세서리 융합석 조합
    },
    {
      title: `[${stats.jobGrowName}] 팔찌 융합석`,
      items: toEquipmentItems(stats.braceletUpgrades.slice(0, 10), 3), // 최소 3개 공간
      additionalContent: specialEquipmentCombinationContent, // 특수장비 융합석 조합
    },
    {
      title: `[${stats.jobGrowName}] 반지 융합석`,
      items: toEquipmentItems(stats.ringUpgrades.slice(0, 10), 3), // 최소 3개 공간
      additionalContent: (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-xs font-bold text-gray-700 mb-2">[{stats.jobGrowName}] 특수장비 융합석 (레벨별)</h4>
          <div className="space-y-2">
            {stats.subEquipmentUpgrades.slice(0, 10).map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-700">{item.itemName}</span>
                <span className="text-sm font-bold text-blue-600">{Math.round(item.percentage * 10) / 10}%</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* 통계 헤더 */}
      <div className="mb-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-base font-bold text-gray-800 mb-2">{stats.jobGrowName} 직업 통계</h3>
        <p className="text-sm text-gray-600">
          총 <span className="font-bold text-primary">{stats.totalCharacters}명</span>의 데이터를 기반으로 합니다.
        </p>
      </div>

      {/* 세트, 방어구, 무기 융합석 아코디언 */}
      <EquipmentAccordion
        title="세트, 방어구, 무기 융합석"
        headerColor="var(--secondary-blue)"
        accentColor="#2563eb"
        sections={armorEquipmentSections}
        additionalContent={
          <>
            {weaponTuneContent}
            {titleLevelContent}
          </>
        }
      />

      {/* 악세, 특장 융합석 아코디언 (3단 그리드) */}
      <EquipmentAccordion
        title="악세, 특장 융합석"
        headerColor="var(--secondary-purple)"
        accentColor="#2563eb"
        sections={accessoryEquipmentSections}
      />

      {/* VP 스킬 아코디언 (게이지 바 형식) */}
      <SkillGaugeAccordion
        title="VP 스킬 (진화/강화)"
        headerColor="var(--primary)"
        evolutionSkills={stats.evolutionSkills}
        enhancementSkills={stats.enhancementSkills}
        jobGrowName={stats.jobGrowName}
      />

      {/* VP 스킬 조합 통계 (아코디언) */}
      {stats.skillCombinations && stats.skillCombinations.length > 0 && (
        <SkillCombinationAccordion
          skillCombinations={stats.skillCombinations}
        />
      )}
    </>
  );
}
