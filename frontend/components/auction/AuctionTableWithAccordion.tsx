'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TrackedItem {
  id: number;
  itemId: string;
  itemName: string;
  itemImageUrl: string;
  addedAt: string;
}

interface ChartData {
  itemId: string;
  itemName: string;
  labels: string[];
  avgPrices: number[];
  minPrices: number[];
  soldAvgPrices: (number | null)[];
  soldMaxPrices: (number | null)[];
  soldCounts: number[];
  itemCounts: number[];
}

interface AuctionItem {
  id: number;
  auctionNo: number;
  regDate: string;
  count: number;
  currentPrice: number;
  unitPrice: number;
}

interface SoldHistory {
  id: number;
  soldDate: string;
  count: number;
  price: number;
  unitPrice: number;
}

interface Props {
  trackedItems: TrackedItem[];
  chartData: { [key: string]: ChartData };
  auctionItems: { [key: string]: AuctionItem[] };
  soldHistory: { [key: string]: SoldHistory[] };
  expandedItem: string | null;
  onExpandItem: (itemId: string) => void;
  chartInterval: { [key: string]: number };
  onChartIntervalChange: (itemId: string, interval: number) => void;
  chartRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
  getChartDataForDisplay: (itemId: string) => any[];
  getPriceYAxisDomain: (itemId: string) => [number, number];
  getItemCountYAxisDomain: (itemId: string) => [number, number];
  getSoldCountYAxisDomain: (itemId: string) => [number, number];
  formatPrice: (price: number) => string;
  formatChartPrice: (price: number) => string;
  getTimeAgo: (dateString: string) => string;
  enableAccordion?: boolean;
  initialExpandedItemId?: string | null;
}

const MAX_CANDLES = 20;

export default function AuctionTableWithAccordion({
  trackedItems,
  chartData,
  auctionItems,
  soldHistory,
  expandedItem,
  onExpandItem,
  chartInterval,
  onChartIntervalChange,
  chartRefs,
  getChartDataForDisplay,
  getPriceYAxisDomain,
  getItemCountYAxisDomain,
  getSoldCountYAxisDomain,
  formatPrice,
  formatChartPrice,
  getTimeAgo,
  enableAccordion = true,
  initialExpandedItemId = null,
}: Props) {
  const router = useRouter();

  const getPriceComparison = (itemId: string) => {
    const data = chartData[itemId];
    if (!data || !data.minPrices || data.minPrices.length === 0) {
      return { current: 0, weekAgo: 0, yesterday: 0, weekChange: 0, dayChange: 0, totalItems: 0 };
    }

    const current = data.minPrices[data.minPrices.length - 1] || 0;
    const weekAgoIdx = Math.max(0, data.minPrices.length - 5040);
    const weekAgo = data.minPrices[weekAgoIdx];
    const yesterdayIdx = Math.max(0, data.minPrices.length - 720);
    const yesterday = data.minPrices[yesterdayIdx];

    const weekChange = weekAgo > 0 ? ((current - weekAgo) / weekAgo) * 100 : 0;
    const dayChange = yesterday > 0 ? ((current - yesterday) / yesterday) * 100 : 0;
    const totalItems = data.itemCounts[data.itemCounts.length - 1] || 0;

    return { current, weekAgo, yesterday, weekChange, dayChange, totalItems };
  };

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
              {enableAccordion ? '' : '상세보기'}
            </th>
          </tr>
        </thead>
        <tbody>
          {trackedItems.map((item) => {
            const isExpanded = expandedItem === item.itemId;
            const priceInfo = getPriceComparison(item.itemId);

            return (
              <React.Fragment key={item.id}>
                <tr
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${enableAccordion ? 'cursor-pointer' : ''}`}
                  onClick={() => enableAccordion && onExpandItem(item.itemId)}
                >
                  <td className="py-3 px-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {item.itemImageUrl ? (
                        <img src={item.itemImageUrl} alt={item.itemName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">📦</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-gray-800">{item.itemName}</div>
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <div className="font-bold text-base text-gray-800">
                      {priceInfo.current > 0 ? formatPrice(priceInfo.current) : '-'}
                    </div>
                    {priceInfo.totalItems > 0 && (
                      <div className="text-xs text-gray-500">등록: {priceInfo.totalItems}개</div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <div className="font-bold text-gray-700">
                      {priceInfo.weekAgo > 0 ? formatPrice(priceInfo.weekAgo) : '-'}
                    </div>
                    {priceInfo.weekChange !== 0 && (
                      <div className={`text-xs font-medium ${priceInfo.weekChange > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                        {priceInfo.weekChange > 0 ? '▲' : '▼'} {Math.abs(priceInfo.weekChange).toFixed(1)}%
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <div className="font-bold text-gray-700">
                      {priceInfo.yesterday > 0 ? formatPrice(priceInfo.yesterday) : '-'}
                    </div>
                    {priceInfo.dayChange !== 0 && (
                      <div className={`text-xs font-medium ${priceInfo.dayChange > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                        {priceInfo.dayChange > 0 ? '▲' : '▼'} {Math.abs(priceInfo.dayChange).toFixed(1)}%
                      </div>
                    )}
                  </td>
                  {enableAccordion ? (
                    <td className="py-3 px-4 text-center">
                      <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-all">
                        <svg
                          className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </td>
                  ) : (
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/auction?itemId=${item.itemId}`);
                        }}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        차트 보기
                      </button>
                    </td>
                  )}
                </tr>

                {/* 차트 행 (확장 시) */}
                {enableAccordion && isExpanded && (
                  <tr className="bg-gray-50">
                    <td colSpan={6} className="p-0">
                      <div className="px-4 py-5 animate-[fadeIn_0.3s_ease-in-out]">
                        <div className="bg-white rounded-xl shadow-lg p-4">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-base font-bold text-gray-800">가격 추이</h3>

                            {/* 시간 간격 조절 버튼 */}
                            <div className="flex gap-1 items-center">
                              <span className="text-xs text-gray-500 mr-2">간격:</span>
                              {[
                                { label: '5분', value: 5 },
                                { label: '10분', value: 10 },
                                { label: '30분', value: 30 },
                                { label: '1시간', value: 60 },
                                { label: '6시간', value: 360 },
                                { label: '12시간', value: 720 },
                                { label: '1일', value: 1440 },
                                { label: '1주일', value: 10080 },
                                { label: '1개월', value: 43200 },
                                { label: '3개월', value: 129600 },
                                { label: '6개월', value: 259200 },
                                { label: '1년', value: 525600 },
                              ].map((option) => (
                                <button
                                  key={option.value}
                                  onClick={() => onChartIntervalChange(item.itemId, option.value)}
                                  className={`px-2 py-1 text-xs rounded transition-all ${
                                    (chartInterval[item.itemId] || 5) === option.value
                                      ? 'bg-blue-600 text-white font-bold'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 가격 추이 차트 */}
                          {chartData[item.itemId] && chartData[item.itemId].labels.length > 0 ? (
                            <div
                              ref={(el) => (chartRefs.current[item.itemId] = el)}
                              className="h-96 mb-4 relative"
                            >
                              <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={getChartDataForDisplay(item.itemId)}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis
                                    dataKey="time"
                                    tick={{ fontSize: 10 }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                  />
                                  <YAxis
                                    yAxisId="price"
                                    domain={getPriceYAxisDomain(item.itemId)}
                                    tick={{ fontSize: 10 }}
                                    tickFormatter={(value) => formatChartPrice(value)}
                                    label={{ value: '가격', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }}
                                  />
                                  <YAxis
                                    yAxisId="itemCount"
                                    orientation="right"
                                    domain={getItemCountYAxisDomain(item.itemId)}
                                    tick={{ fontSize: 10 }}
                                    tickFormatter={(value) => value.toLocaleString()}
                                    label={{ value: '등록물량', angle: 90, position: 'insideRight', offset: 10, style: { fontSize: 10 } }}
                                  />
                                  <YAxis
                                    yAxisId="soldCount"
                                    orientation="right"
                                    domain={getSoldCountYAxisDomain(item.itemId)}
                                    tick={{ fontSize: 10 }}
                                    tickFormatter={(value) => value.toLocaleString()}
                                    label={{ value: '거래량', angle: 90, position: 'insideRight', offset: -10, style: { fontSize: 10 } }}
                                    hide={true}
                                  />
                                  <Tooltip
                                    formatter={(value: any, name: string, props: any) => {
                                      if (name === '등록물량' || name === '거래량') {
                                        return [value.toLocaleString() + '개', name];
                                      }
                                      if (name === '거래최고가') {
                                        const 원본 = props.payload.거래최고가_원본;
                                        const 정상최고가 = value;

                                        if (원본 && 정상최고가 && 원본 !== 정상최고가) {
                                          // 이상치가 있는 경우: 두 값 모두 표시
                                          return [
                                            `${formatPrice(정상최고가)} (정상) / ${formatPrice(원본)} (이상치)`,
                                            name
                                          ];
                                        }
                                      }
                                      return [value ? formatPrice(Number(value)) : '-', name];
                                    }}
                                    contentStyle={{ fontSize: 12 }}
                                  />
                                  <Legend />
                                  <Bar yAxisId="itemCount" dataKey="등록물량" fill="#93c5fd" opacity={0.6} />
                                  <Line yAxisId="soldCount" type="monotone" dataKey="거래량" stroke="#f97316" strokeWidth={3} dot={false} />
                                  <Line yAxisId="price" type="monotone" dataKey="최저가" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                  <Line yAxisId="price" type="monotone" dataKey="거래평균가" stroke="#10b981" strokeWidth={2} dot={false} />
                                  <Line yAxisId="price" type="monotone" dataKey="거래최고가" stroke="#ef4444" strokeWidth={2} dot={false} />
                                  <Line
                                    yAxisId="price"
                                    type="monotone"
                                    dataKey="이상치표시"
                                    stroke="transparent"
                                    strokeWidth={0}
                                    dot={(props: any) => {
                                      const { cx, cy, payload, index } = props;
                                      if (!payload.이상치표시) return null;

                                      return (
                                        <g key={`outlier-${index}`}>
                                          <circle cx={cx} cy={cy} r={10} fill="#ef4444" stroke="#fff" strokeWidth={2} />
                                          <rect x={cx - 1.5} y={cy - 6} width={3} height={7} fill="#fff" rx={1} />
                                          <circle cx={cx} cy={cy + 4} r={1.5} fill="#fff" />
                                        </g>
                                      );
                                    }}
                                    legendType="none"
                                    activeDot={false}
                                  />
                                </ComposedChart>
                              </ResponsiveContainer>
                            </div>
                          ) : (
                            <div className="h-48 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl mb-4">
                              <div className="text-center">
                                <p className="text-sm text-gray-700 font-medium">데이터 수집 중...</p>
                                <p className="text-xs text-gray-500 mt-1">2분마다 자동으로 수집됩니다</p>
                              </div>
                            </div>
                          )}

                          {/* 등록 물량 및 최근 거래 */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* 등록 물량 */}
                            <div>
                              <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                                등록 물량 (가격 오름차순)
                              </h4>
                              <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <table className="w-full text-xs whitespace-nowrap">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="py-1.5 px-2 text-left font-semibold text-gray-700">등록시간</th>
                                      <th className="py-1.5 px-2 text-center font-semibold text-gray-700">물량</th>
                                      <th className="py-1.5 px-2 text-right font-semibold text-gray-700">가격</th>
                                      <th className="py-1.5 px-2 text-right font-semibold text-gray-700">개당</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {auctionItems[item.itemId]?.slice(0, 10).map((listing) => (
                                      <tr key={listing.id} className="hover:bg-blue-50 transition-colors">
                                        <td className="py-1.5 px-2 text-gray-600">{getTimeAgo(listing.regDate)}</td>
                                        <td className="py-1.5 px-2 text-center font-medium text-gray-800">{listing.count}개</td>
                                        <td className="py-1.5 px-2 text-right font-semibold text-gray-800">{formatPrice(listing.currentPrice)}</td>
                                        <td className="py-1.5 px-2 text-right text-blue-600 font-semibold">{formatPrice(listing.unitPrice)}</td>
                                      </tr>
                                    ))}
                                    {(!auctionItems[item.itemId] || auctionItems[item.itemId].length === 0) && (
                                      <tr>
                                        <td colSpan={4} className="py-4 text-center text-gray-500">등록된 매물이 없습니다</td>
                                      </tr>
                                    )}
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
                                <table className="w-full text-xs whitespace-nowrap">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="py-1.5 px-2 text-left font-semibold text-gray-700">거래시간</th>
                                      <th className="py-1.5 px-2 text-center font-semibold text-gray-700">물량</th>
                                      <th className="py-1.5 px-2 text-right font-semibold text-gray-700">가격</th>
                                      <th className="py-1.5 px-2 text-right font-semibold text-gray-700">개당</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {soldHistory[item.itemId]?.slice(0, 10).map((trade) => (
                                      <tr key={trade.id} className="hover:bg-green-50 transition-colors">
                                        <td className="py-1.5 px-2 text-gray-600">{getTimeAgo(trade.soldDate)}</td>
                                        <td className="py-1.5 px-2 text-center font-medium text-gray-800">{trade.count}개</td>
                                        <td className="py-1.5 px-2 text-right font-semibold text-gray-800">{formatPrice(trade.price)}</td>
                                        <td className="py-1.5 px-2 text-right text-green-600 font-semibold">{formatPrice(trade.unitPrice)}</td>
                                      </tr>
                                    ))}
                                    {(!soldHistory[item.itemId] || soldHistory[item.itemId].length === 0) && (
                                      <tr>
                                        <td colSpan={4} className="py-4 text-center text-gray-500">최근 거래 내역이 없습니다</td>
                                      </tr>
                                    )}
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
        </tbody>
      </table>
    </div>
  );
}
