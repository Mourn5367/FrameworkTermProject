'use client';

import { useState, ReactNode } from 'react';

interface AccordionProps {
  title: string;
  subtitle?: string;
  headerColor?: string;
  defaultExpanded?: boolean;
  children: ReactNode;
}

export default function Accordion({
  title,
  subtitle = '명성 상위 100등 통계',
  headerColor = 'var(--primary)',
  defaultExpanded = false,
  children
}: AccordionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="bg-white rounded-xl shadow-md mb-6 overflow-hidden">
      {/* 상단 헤더 */}
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
        <>
          {/* 내용 */}
          <div className="p-6">
            {children}
          </div>

          {/* 하단 접기 버튼 */}
          <div
            className="px-6 py-4 flex items-center justify-center cursor-pointer border-t border-gray-200 hover:bg-gray-50 transition-colors"
            onClick={() => setIsExpanded(false)}
          >
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-sm font-medium">접기</span>
              <svg
                className="w-5 h-5 rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
