'use client';

import { useState } from 'react';

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
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-md mb-6 overflow-hidden">
      <div
        className="px-6 py-4 flex items-center justify-between cursor-pointer"
        style={{ background: headerColor }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white opacity-90">{subtitle}</span>
          <svg
            className={`w-6 h-6 text-white transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sections.map((section, sectionIdx) => (
              <div key={sectionIdx} className="border border-gray-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                  {section.title}
                </h3>
                <div className="space-y-2">
                  {section.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-xs text-gray-700 font-medium">{item.name}</span>
                      <span className="text-sm font-bold" style={{ color: accentColor }}>
                        {item.percentage}%
                      </span>
                    </div>
                  ))}
                </div>

                {/* 각 섹션별 추가 컨텐츠 */}
                {section.additionalContent}

                {/* 전역 추가 컨텐츠 (마지막 섹션에만 표시) */}
                {sectionIdx === sections.length - 1 && additionalContent}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
