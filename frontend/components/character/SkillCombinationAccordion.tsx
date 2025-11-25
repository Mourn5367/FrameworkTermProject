'use client';

import { CombinationStat } from '@/lib/api/equipmentStats';
import Accordion from '@/components/common/Accordion';

interface SkillCombinationAccordionProps {
  skillCombinations: CombinationStat[];
}

export default function SkillCombinationAccordion({ skillCombinations }: SkillCombinationAccordionProps) {
  return (
    <Accordion title="VP 스킬 조합 (진화 + 강화)" headerColor="var(--secondary-blue)">
      <div className="space-y-4">
        {skillCombinations.slice(0, 10).map((combo, idx) => {
          // [진화] ... [강화] ... 형식 파싱
          const evolutionMatch = combo.combination.match(/\[진화\]\s*([^\[]+)/);
          const enhancementMatch = combo.combination.match(/\[강화\]\s*(.+)$/);

          const evolutionSkills = evolutionMatch ? evolutionMatch[1].split('|').map(s => s.trim()).filter(s => s) : [];
          const enhancementSkills = enhancementMatch ? enhancementMatch[1].split('|').map(s => s.trim()).filter(s => s) : [];

          return (
            <div key={idx} className="border border-gray-200 rounded-lg p-4">
              {/* 상단: 퍼센트 */}
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-gray-500">조합 #{idx + 1}</span>
                <span className="text-lg font-bold text-primary">
                  {Math.round(combo.percentage * 10) / 10}%
                </span>
              </div>

              {/* 장비 태그 */}
              {combo.tags && combo.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {combo.tags.map((tag, tagIdx) => (
                    <span
                      key={tagIdx}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 진화 스킬 목록 */}
                {evolutionSkills.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-blue-600 mb-2">진화 스킬</h4>
                    <div className="space-y-1">
                      {evolutionSkills.map((skill, skillIdx) => (
                        <div key={skillIdx} className="text-sm text-gray-700 pl-2 border-l-2 border-blue-400">
                          {skill}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 강화 스킬 목록 */}
                {enhancementSkills.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-purple-600 mb-2">강화 스킬</h4>
                    <div className="space-y-1">
                      {enhancementSkills.map((skill, skillIdx) => (
                        <div key={skillIdx} className="text-sm text-gray-700 pl-2 border-l-2 border-purple-400">
                          {skill}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Accordion>
  );
}
