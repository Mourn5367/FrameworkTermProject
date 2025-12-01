'use client';

import React from 'react';

interface AuctionTableSkeletonProps {
  rows?: number;
  showDetailsColumn?: boolean;
}

export default function AuctionTableSkeleton({ rows = 3, showDetailsColumn = false }: AuctionTableSkeletonProps) {
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <tr>
            <th className="py-2.5 px-4 text-left font-bold">아이콘</th>
            <th className="py-2.5 px-4 text-left font-bold">이름</th>
            <th className="py-2.5 px-4 text-center font-bold">현재 개당 가격</th>
            <th className="py-2.5 px-4 text-center font-bold">1주전 개당 가격</th>
            <th className="py-2.5 px-4 text-center font-bold">어제 개당 가격</th>
            <th className="py-2.5 px-4 text-center font-bold w-32">
              {showDetailsColumn ? '상세보기' : ''}
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-b border-gray-100 animate-pulse">
              <td className="py-3 px-4">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              </td>
              <td className="py-3 px-4">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </td>
              <td className="py-3 px-4">
                <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
              </td>
              <td className="py-3 px-4">
                <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
              </td>
              <td className="py-3 px-4">
                <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
              </td>
              <td className="py-3 px-4 text-center">
                {showDetailsColumn ? (
                  <div className="h-7 bg-gray-200 rounded w-20 mx-auto"></div>
                ) : (
                  <div className="w-5 h-5 bg-gray-200 rounded mx-auto"></div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
