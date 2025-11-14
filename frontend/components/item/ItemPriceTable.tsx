'use client';

export interface PriceItem {
  id: number;
  name: string;
  grade: string;
  price: number;
  change: number;
  changeDirection: 'up' | 'down';
}

interface ItemPriceTableProps {
  items: PriceItem[];
  title?: string;
  headerColor?: string;
}

export default function ItemPriceTable({
  items,
  title = '실시간 아이템 시세',
  headerColor = 'var(--primary)'
}: ItemPriceTableProps) {

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case '전설':
        return 'from-purple-400 to-pink-400';
      case '신화':
        return 'from-yellow-400 to-orange-400';
      case '에픽':
        return 'from-purple-500 to-indigo-500';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md mb-6 overflow-hidden">
      <div className="px-6 py-4" style={{ background: headerColor }}>
        <h2 className="text-lg font-bold text-white">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead style={{ background: '#F8F9FA' }}>
            <tr>
              <th className="py-3 px-6 text-left text-sm font-bold text-gray-700">아이템 명</th>
              <th className="py-3 px-6 text-center text-sm font-bold text-gray-700">가격</th>
              <th className="py-3 px-6 text-center text-sm font-bold text-gray-700">추이(전일 대비)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-gradient-to-br ${getGradeColor(item.grade)} rounded-lg flex items-center justify-center text-white font-bold text-xs`}>
                      {item.grade}
                    </div>
                    <span className="font-medium text-gray-800">{item.name}</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-center font-bold text-gray-800">
                  {item.price.toLocaleString()}
                </td>
                <td className="py-4 px-6 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className={item.changeDirection === 'up' ? 'text-red-500' : 'text-blue-500'}>
                      {item.changeDirection === 'up' ? '▲' : '▼'}
                    </span>
                    <span className={`font-bold ${item.changeDirection === 'up' ? 'text-red-500' : 'text-blue-500'}`}>
                      {item.change.toLocaleString()}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
