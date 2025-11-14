'use client';

import { useState } from 'react';

export interface Notice {
  id: number;
  title: string;
  date: string;
  content: string;
}

interface NoticeSectionProps {
  notices: Notice[];
  title?: string;
  headerColor?: string;
  contentBgColor?: string;
  contentBorderColor?: string;
  initialShowCount?: number;
}

export default function NoticeSection({
  notices,
  title = '공지사항',
  headerColor = 'var(--secondary-blue)',
  contentBgColor = 'bg-blue-50',
  contentBorderColor = 'border-blue-500',
  initialShowCount = 2
}: NoticeSectionProps) {
  const [expandedNotice, setExpandedNotice] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const displayedNotices = showAll ? notices : notices.slice(0, initialShowCount);

  return (
    <div className="bg-white rounded-xl shadow-md mb-6 overflow-hidden">
      <div className="px-6 py-4" style={{ background: headerColor }}>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          {title}
        </h2>
      </div>
      <div className="p-6">
        <ul className="space-y-2">
          {displayedNotices.map((notice) => (
            <li key={notice.id}>
              <div
                className="flex items-start gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setExpandedNotice(expandedNotice === notice.id ? null : notice.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-800">{notice.title}</p>
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${expandedNotice === notice.id ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{notice.date}</p>
                </div>
              </div>
              {expandedNotice === notice.id && (
                <div className={`ml-2 mr-2 mt-2 mb-3 p-4 ${contentBgColor} rounded-lg border-l-4 ${contentBorderColor}`}>
                  <p className="text-sm text-gray-700 leading-relaxed">{notice.content}</p>
                </div>
              )}
            </li>
          ))}
        </ul>

        {notices.length > initialShowCount && (
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
                  <span>더보기 ({notices.length - initialShowCount}개)</span>
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
