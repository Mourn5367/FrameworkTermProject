'use client';

import React, { useState } from 'react';
import Logo from '@/components/layout/Logo';
import Footer from '@/components/layout/Footer';

export default function AuctionPage() {
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  const items = [
    {
      id: 1,
      icon: '⚔️',
      name: '누트럼 우측 회심표 밀으로 바껴먼서 밀으로 창 스르륵 생길',
      category: '장비 · 무기',
      price: 12500000,
      weekAgoPrice: 11800000,
      yesterdayPrice: 12300000,
    },
    {
      id: 2,
      icon: '🛡️',
      name: '가격 최저가, 평균가, 최대가 워으선 차트',
      category: '장비 · 방어구',
      price: 8750000,
      weekAgoPrice: 9200000,
      yesterdayPrice: 8900000,
    },
  ];

  const calculateChange = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    return {
      percentage: Math.abs(change).toFixed(1),
      isPositive: change > 0,
    };
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString();
  };

  return (
    <div className="page-wrapper bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="flex-1">
        <div className="app-container">
          <Logo />

        {/* 아이템 테이블 */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <tr>
                <th className="py-2.5 px-4 text-left font-bold">아이콘</th>
                <th className="py-2.5 px-4 text-left font-bold">이름</th>
                <th className="py-2.5 px-4 text-center font-bold">가격</th>
                <th className="py-2.5 px-4 text-center font-bold">1주전 평균 가격</th>
                <th className="py-2.5 px-4 text-center font-bold">어제 대비 현재 가격</th>
                <th className="py-2.5 px-4 text-center font-bold w-12"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const weekChange = calculateChange(item.price, item.weekAgoPrice);
                const dayChange = calculateChange(item.price, item.yesterdayPrice);
                const isExpanded = expandedItem === item.id;

                return (
                  <React.Fragment key={item.id}>
                    {/* 아이템 행 */}
                    <tr
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                    >
                      <td className="py-3 px-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                          <span className="text-xl">{item.icon}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-800">{item.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{item.category}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="font-bold text-base text-gray-800">{formatPrice(item.price)}</div>
                        <div className="text-xs text-gray-500">골드</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="font-bold text-gray-700">{formatPrice(item.weekAgoPrice)}</div>
                        <div className={`text-xs font-medium ${weekChange.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {weekChange.isPositive ? '▲' : '▼'} {weekChange.percentage}%
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="font-bold text-gray-700">{formatPrice(item.yesterdayPrice)}</div>
                        <div className={`text-xs font-medium ${dayChange.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {dayChange.isPositive ? '▲' : '▼'} {dayChange.percentage}%
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-all">
                          <svg
                            className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </td>
                    </tr>

                    {/* 차트 행 (확장 시) */}
                    {isExpanded && (
                      <tr className="bg-gray-50">
                        <td colSpan={6} className="p-0">
                          <div className="px-4 py-5 animate-[fadeIn_0.3s_ease-in-out]">
                            <div className="bg-white rounded-xl shadow-lg p-4">
                              <h3 className="text-base font-bold text-gray-800 mb-3">{item.name} - 가격 추이</h3>

                              {/* 가격 추이 차트 */}
                              <div className="h-48 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl mb-4">
                                <div className="text-center">
                                  <div className="w-12 h-12 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-3">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                    </svg>
                                  </div>
                                  <p className="text-sm text-gray-700 font-medium">가격 추이 차트 (최저가, 평균가, 최대가)</p>
                                  <p className="text-xs text-gray-500 mt-1">실제 데이터 연동 시 차트가 표시됩니다</p>
                                </div>
                              </div>

                              {/* 등록 물량 및 최근 거래 */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* 등록 물량 */}
                                <div>
                                  <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                                    등록 물량 (가격 오름차순)
                                  </h4>
                                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-xs">
                                      <thead className="bg-gray-100">
                                        <tr>
                                          <th className="py-1.5 px-2 text-left font-semibold text-gray-700">등록시간</th>
                                          <th className="py-1.5 px-2 text-center font-semibold text-gray-700">물량</th>
                                          <th className="py-1.5 px-2 text-right font-semibold text-gray-700">가격</th>
                                          <th className="py-1.5 px-2 text-right font-semibold text-gray-700">개당</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100">
                                        {[
                                          { time: '10초 전', quantity: 5, price: 62500000, unit: 12500000 },
                                          { time: '2분 전', quantity: 10, price: 130000000, unit: 13000000 },
                                          { time: '5분 전', quantity: 3, price: 40500000, unit: 13500000 },
                                          { time: '12분 전', quantity: 8, price: 112000000, unit: 14000000 },
                                          { time: '25분 전', quantity: 15, price: 217500000, unit: 14500000 },
                                          { time: '1시간 전', quantity: 7, price: 105000000, unit: 15000000 },
                                          { time: '2시간 전', quantity: 20, price: 310000000, unit: 15500000 },
                                          { time: '3시간 전', quantity: 12, price: 192000000, unit: 16000000 },
                                          { time: '5시간 전', quantity: 6, price: 99000000, unit: 16500000 },
                                          { time: '8시간 전', quantity: 4, price: 68000000, unit: 17000000 },
                                        ].map((listing, idx) => (
                                          <tr key={idx} className="hover:bg-blue-50 transition-colors">
                                            <td className="py-1.5 px-2 text-gray-600">{listing.time}</td>
                                            <td className="py-1.5 px-2 text-center font-medium text-gray-800">{listing.quantity}개</td>
                                            <td className="py-1.5 px-2 text-right font-semibold text-gray-800">{listing.price.toLocaleString()}</td>
                                            <td className="py-1.5 px-2 text-right text-blue-600 font-semibold">{listing.unit.toLocaleString()}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                {/* 최근 거래 */}
                                <div>
                                  <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                                    최근 거래
                                  </h4>
                                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-xs">
                                      <thead className="bg-gray-100">
                                        <tr>
                                          <th className="py-1.5 px-2 text-left font-semibold text-gray-700">거래시간</th>
                                          <th className="py-1.5 px-2 text-center font-semibold text-gray-700">물량</th>
                                          <th className="py-1.5 px-2 text-right font-semibold text-gray-700">가격</th>
                                          <th className="py-1.5 px-2 text-right font-semibold text-gray-700">개당</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100">
                                        {[
                                          { time: '5초 전', quantity: 2, price: 25000000, unit: 12500000 },
                                          { time: '1분 전', quantity: 5, price: 63000000, unit: 12600000 },
                                          { time: '3분 전', quantity: 10, price: 127000000, unit: 12700000 },
                                          { time: '8분 전', quantity: 3, price: 38400000, unit: 12800000 },
                                          { time: '15분 전', quantity: 7, price: 90300000, unit: 12900000 },
                                          { time: '30분 전', quantity: 4, price: 52000000, unit: 13000000 },
                                          { time: '1시간 전', quantity: 12, price: 157200000, unit: 13100000 },
                                          { time: '2시간 전', quantity: 8, price: 105600000, unit: 13200000 },
                                          { time: '4시간 전', quantity: 15, price: 199500000, unit: 13300000 },
                                          { time: '6시간 전', quantity: 6, price: 80400000, unit: 13400000 },
                                        ].map((trade, idx) => (
                                          <tr key={idx} className="hover:bg-green-50 transition-colors">
                                            <td className="py-1.5 px-2 text-gray-600">{trade.time}</td>
                                            <td className="py-1.5 px-2 text-center font-medium text-gray-800">{trade.quantity}개</td>
                                            <td className="py-1.5 px-2 text-right font-semibold text-gray-800">{trade.price.toLocaleString()}</td>
                                            <td className="py-1.5 px-2 text-right text-green-600 font-semibold">{trade.unit.toLocaleString()}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {/* 빈 행들 */}
              {[...Array(3)].map((_, i) => (
                <tr key={`empty-${i}`} className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-400 text-sm">-</td>
                  <td className="py-3 px-4 text-gray-400 text-sm">-</td>
                  <td className="py-3 px-4 text-center text-gray-400 text-sm">-</td>
                  <td className="py-3 px-4 text-center text-gray-400 text-sm">-</td>
                  <td className="py-3 px-4 text-center text-gray-400 text-sm">-</td>
                  <td className="py-3 px-4 text-center text-gray-400 text-sm">-</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      </div>

      {/* 푸터 */}
      <Footer />
    </div>
  );
}
