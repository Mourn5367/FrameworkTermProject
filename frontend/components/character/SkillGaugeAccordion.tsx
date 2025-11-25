'use client';

import { SkillStat } from '@/lib/api/equipmentStats';
import Accordion from '@/components/common/Accordion';

interface SkillGaugeAccordionProps {
  title: string;
  subtitle?: string;
  headerColor?: string;
  evolutionSkills: SkillStat[];
  enhancementSkills: SkillStat[];
  jobGrowName: string;
}

export default function SkillGaugeAccordion({
  title,
  subtitle = '명성 상위 100등 통계',
  headerColor = 'var(--primary)',
  evolutionSkills,
  enhancementSkills,
  jobGrowName
}: SkillGaugeAccordionProps) {

  const renderSkillGauge = (skill: SkillStat, isEnhancement: boolean = false) => {
    const type1Pct = Math.round(skill.type1Percentage * 10) / 10;
    const type2Pct = Math.round(skill.type2Percentage * 10) / 10;

    // 강화 스킬인 경우 간단하게 표시
    const type1Label = isEnhancement ? "스킬 공격력 증가" : skill.type1Name;
    const type2Label = isEnhancement ? "스킬 쿨타임 감소" : skill.type2Name;

    return (
      <div key={skill.skillId} className="mb-4">
        {/* 스킬 이름 및 전체 사용률 */}
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold text-gray-800">{skill.skillName}</span>
          <span className="text-sm font-bold text-primary">
            {Math.round(skill.percentage * 10) / 10}%
          </span>
        </div>

        {/* 게이지 바 */}
        <div className="relative h-8 bg-gray-200 rounded-lg overflow-hidden">
          {/* Type 1 게이지 (파란색) */}
          <div
            className="absolute left-0 top-0 h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${type1Pct}%` }}
          />

          {/* Type 2 게이지 (보라색) */}
          <div
            className="absolute top-0 h-full bg-purple-500 transition-all duration-300"
            style={{ left: `${type1Pct}%`, width: `${type2Pct}%` }}
          />
        </div>

        {/* 색상 범례 */}
        <div className="flex gap-4 mt-2 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>{type1Label} ({type1Pct}%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span>{type2Label} ({type2Pct}%)</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Accordion title={title} subtitle={subtitle} headerColor={headerColor}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 진화 스킬 */}
        <div className="border border-gray-200 rounded-xl p-4">
          <h3 className="text-base font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
            [{jobGrowName}] 진화 스킬
          </h3>
          <div>
            {evolutionSkills.slice(0, 10).map(skill => renderSkillGauge(skill))}
          </div>
        </div>

        {/* 강화 스킬 */}
        <div className="border border-gray-200 rounded-xl p-4">
          <h3 className="text-base font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
            [{jobGrowName}] 강화 스킬
          </h3>
          <div>
            {enhancementSkills.slice(0, 10).map(skill => renderSkillGauge(skill, true))}
          </div>
        </div>
      </div>
    </Accordion>
  );
}
