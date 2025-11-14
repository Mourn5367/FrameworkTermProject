'use client';

import { useState } from 'react';

export interface Update {
  id: number;
  title: string;
  date: string;
  content: string;
}

interface UpdateSectionProps {
  updates: Update[];
  title?: string;
  headerColor?: string;
  contentBgColor?: string;
  contentBorderColor?: string;
  initialShowCount?: number;
}

export default function UpdateSection({
  updates,
  title = '업데이트 사항',
  headerColor = 'var(--secondary-purple)',
  contentBgColor = 'bg-purple-50',
  contentBorderColor = 'border-purple-500',
  initialShowCount = 2
}: UpdateSectionProps) {
  const [expandedUpdate, setExpandedUpdate] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const displayedUpdates = showAll ? updates : updates.slice(0, initialShowCount);

  return (
    <div className="bg-white rounded-xl shadow-md mb-6 overflow-hidden">
      <div className="px-6 py-4" style={{ background: headerColor }}>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
          {title}
        </h2>
      </div>
      <div className="p-6">
        <ul className="space-y-2">
          {displayedUpdates.map((update) => (
            <li key={update.id}>
              <div
                className="flex items-start gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setExpandedUpdate(expandedUpdate === update.id ? null : update.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-800">{update.title}</p>
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${expandedUpdate === update.id ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{update.date}</p>
                </div>
              </div>
              {expandedUpdate === update.id && (
                <div className={`ml-2 mr-2 mt-2 mb-3 p-4 ${contentBgColor} rounded-lg border-l-4 ${contentBorderColor}`}>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{update.content}</p>
                </div>
              )}
            </li>
          ))}
        </ul>

        {updates.length > initialShowCount && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm font-medium hover:underline transition-colors flex items-center gap-1 mx-auto"
              style={{ color: headerColor }}
            >
              {showAll ? (
                <>
                  <span>접기</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </>
              ) : (
                <>
                  <span>더보기 ({updates.length - initialShowCount}개)</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
