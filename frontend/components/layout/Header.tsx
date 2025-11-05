export default function Header() {
  return (
    <>
      {/* 로고 */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
          던파 인사이트
        </h1>
        <p className="text-gray-600 text-base">DnF Insight - 캐릭터 분석 & 시세</p>
      </div>

      {/* 검색 섹션 */}
      <div className="bg-white rounded-2xl shadow-xl mb-6 overflow-hidden">
        {/* 검색 입력 영역 */}
        <div className="flex flex-col md:flex-row gap-3 p-4">
          <select className="px-4 py-2.5 text-sm border-2 border-gray-200 rounded-lg font-medium bg-white hover:border-blue-400 focus:border-blue-500 focus:outline-none transition-colors">
            <option>서버 선택</option>
            <option>카인</option>
            <option>디레지에</option>
            <option>시로코</option>
            <option>프레이</option>
            <option>카시야스</option>
          </select>
          <input
            type="text"
            placeholder="닉네임을 입력하세요"
            className="flex-1 px-4 py-2.5 text-sm border-2 border-gray-200 rounded-lg font-medium hover:border-blue-400 focus:border-blue-500 focus:outline-none transition-colors"
          />
          <button className="px-6 py-2.5 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl">
            검색
          </button>
        </div>

        {/* 최근 검색 목록 */}
        <div className="border-t border-gray-200 bg-gray-50 py-4 px-4">
          <h2 className="text-base font-bold text-center text-gray-700 mb-3">최근 검색 목록 및 즐겨 찾기</h2>
          <div className="flex flex-wrap gap-2 justify-center">
            <span className="px-3 py-1.5 bg-white rounded-full text-xs text-gray-600 border border-gray-200 hover:border-blue-400 cursor-pointer transition-colors">
              검색 기록 없음
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
