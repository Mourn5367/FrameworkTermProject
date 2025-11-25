'use client';

import Accordion from '@/components/common/Accordion';

export interface EquipmentData {
  title: string;
  items: {
    name: string;
    percentage: number;
  }[];
  additionalContent?: React.ReactNode;
}

interface EquipmentAccordionProps {
  title: string;
  subtitle?: string;
  headerColor?: string;
  accentColor?: string;
  sections: EquipmentData[];
  additionalContent?: React.ReactNode;
}

export default function EquipmentAccordion({
  title,
  subtitle = '명성 상위 100등 통계',
  headerColor = 'var(--secondary-blue)',
  accentColor = '#2563eb',
  sections,
  additionalContent
}: EquipmentAccordionProps) {
  return (
    <Accordion title={title} subtitle={subtitle} headerColor={headerColor}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sections.map((section, sectionIdx) => (
          <div key={sectionIdx} className="border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200">
              {section.title}
            </h3>
            <div className="space-y-2">
              {section.items.map((item, itemIdx) => (
                item.name ? (
                  <div key={itemIdx} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-xs text-gray-700 font-medium">{item.name}</span>
                    <span className="text-sm font-bold" style={{ color: accentColor }}>
                      {item.percentage}%
                    </span>
                  </div>
                ) : (
                  <div key={itemIdx} className="py-2 px-3" style={{ height: '36px' }}></div>
                )
              ))}
            </div>

            {/* 각 섹션별 추가 컨텐츠 */}
            {section.additionalContent}

            {/* 전역 추가 컨텐츠 (마지막 섹션에만 표시) */}
            {sectionIdx === sections.length - 1 && additionalContent}
          </div>
        ))}
      </div>
    </Accordion>
  );
}
