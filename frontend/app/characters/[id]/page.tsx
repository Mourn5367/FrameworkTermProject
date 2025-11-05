import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function CharacterDetailPage() {
  return (
    <div className="page-wrapper bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="flex-1">
        <div className="app-container">
          <Header />

        {/* 캐릭터 기본 정보 */}
        <div className="bg-white rounded-2xl shadow-xl mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3">
            <h2 className="text-lg font-bold text-white">캐릭터 정보</h2>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* 캐릭터 이미지 섹션 */}
              <div className="flex flex-col gap-3">
                {/* 캐릭터 사진 (7) */}
                <div
                  className="w-full bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl overflow-hidden relative"
                  style={{ flex: 'var(--character-photo-ratio)' }}
                >
                  {/* 이미지가 없을 때 플레이스홀더 */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl mb-1">📷</div>
                      <p className="text-xs text-gray-600 font-medium">캐릭터 사진</p>
                    </div>
                  </div>

                  {/* 실제 이미지 영역 */}
                  {/* <img
                    src="/images/characters/character-photo.png"
                    alt="캐릭터 사진"
                    className="w-full h-full object-cover object-center"
                  /> */}
                </div>

                {/* 직업 일러스트 (3) */}
                <div
                  className="w-full bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl overflow-hidden relative"
                  style={{ flex: 'var(--job-illustration-ratio)' }}
                >
                  {/* 이미지가 없을 때 플레이스홀더 */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl mb-1">🎨</div>
                      <p className="text-xs text-gray-600 font-medium">직업 일러스트</p>
                    </div>
                  </div>

                  {/* 실제 이미지 영역 */}
                  {/* <img
                    src="/images/characters/job-illustration.png"
                    alt="직업 일러스트"
                    className="w-full h-full object-cover object-center"
                  /> */}
                </div>
              </div>

              {/* 캐릭터 정보 */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                    명성 수치
                  </h2>
                  <p className="text-2xl font-bold text-gray-800">12,500</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-gray-600 mb-0.5">닉네임</h3>
                    <p className="text-sm font-medium text-gray-800">플레이어123</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-600 mb-0.5">서버</h3>
                    <p className="text-sm font-medium text-gray-800">카인</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-gray-600 mb-0.5">모험단</h3>
                    <p className="text-sm font-medium text-gray-800">모험단명</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-600 mb-0.5">길드명</h3>
                    <p className="text-sm font-medium text-gray-800">길드명</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-700 mb-3">접속 시간대</h3>
                  <div className="flex items-center gap-4">
                    {/* 시계 그래프 */}
                    <div className="relative w-24 h-24 flex-shrink-0">
                      <svg viewBox="0 0 100 100" className="transform -rotate-90">
                        {/* 배경 원 */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="8"
                        />
                        {/* 활동 시간대 표시 (18시~24시 = 270도~360도) */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="url(#gradient)"
                          strokeWidth="8"
                          strokeDasharray="62.83 188.5"
                          strokeDashoffset="62.83"
                          strokeLinecap="round"
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#a855f7" />
                          </linearGradient>
                        </defs>
                      </svg>
                      {/* 중앙 텍스트 */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            6시간
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 시간대 정보 */}
                    <div>
                      <p className="text-sm text-gray-700 font-medium mb-1">주요 활동 시간</p>
                      <p className="text-xs text-gray-600">오후 6시 ~ 자정</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600"></div>
                        <span className="text-xs text-gray-500">평균 6시간/일</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 주간 던전 목록 */}
              <div>
                <h2 className="text-lg font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                  주간 던전 목록
                </h2>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="text-sm font-medium text-gray-700">상급던전</span>
                    <span className="text-sm font-bold text-blue-600">0/2</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="text-sm font-medium text-gray-700">배누스</span>
                    <span className="text-sm font-bold text-blue-600">0/1</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="text-sm font-medium text-gray-700">나벨</span>
                    <span className="text-sm font-bold text-blue-600">0/1</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="text-sm font-medium text-gray-700">이넬 황혼전</span>
                    <span className="text-sm font-bold text-blue-600">0/1</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                    <p className="text-xs text-gray-700">
                      <span className="font-bold">금주 먹은 등급 개수:</span> 레전더리: 0개 | 에픽: 0개 | 태초: 0개
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                    <p className="text-xs text-gray-700">
                      <span className="font-bold">저번 주 먹은 등급 개수:</span> 레전더리: 2개 | 에픽: 5개 | 태초: 1개
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 장비 세트 정보 */}
        <div className="bg-white rounded-2xl shadow-xl mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">장비 세트</h2>
            <p className="text-blue-100 text-xs">명성 상위 100등 통계</p>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 선호 장비 세트 */}
              <div className="border-2 border-gray-200 rounded-xl p-4 hover:border-blue-400 transition-colors flex flex-col">
                <h3 className="font-bold text-sm text-gray-800 mb-3 text-center border-b border-gray-200 pb-2">
                  [검색 캐릭터 직업명] 선호 장비 세트
                </h3>
                <div className="flex-1 flex flex-col justify-between gap-2">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg flex items-center justify-between px-3 py-3 flex-1 min-h-[45px]">
                      <span className="text-gray-700 font-semibold text-xs">아이템 {i + 1}</span>
                      <span className="text-blue-600 font-bold text-sm">{85 - i * 3}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 선호 무기 */}
              <div className="border-2 border-gray-200 rounded-xl p-4 hover:border-blue-400 transition-colors flex flex-col">
                <h3 className="font-bold text-sm text-gray-800 mb-3 text-center border-b border-gray-200 pb-2">
                  [검색 캐릭터 직업명] 선호 무기
                </h3>
                <div className="flex-1 flex flex-col justify-between gap-2">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg flex items-center justify-between px-3 py-3 flex-1 min-h-[45px]">
                      <span className="text-gray-700 font-semibold text-xs">무기 {i + 1}</span>
                      <span className="text-blue-600 font-bold text-sm">{80 - i * 4}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 선호 VP 스킬 */}
              <div className="border-2 border-gray-200 rounded-xl p-4 hover:border-blue-400 transition-colors flex flex-col">
                <h3 className="font-bold text-sm text-gray-800 mb-3 text-center border-b border-gray-200 pb-2">
                  [검색 캐릭터 직업명] 선호 VP 스킬
                </h3>
                <div className="space-y-2">
                  {[
                    { slot: 'VP 슬롯 1', slotPercent: 95, skill1: '스킬 A', percent1: 65, skill2: '스킬 B', percent2: 35 },
                    { slot: 'VP 슬롯 2', slotPercent: 88, skill1: '스킬 C', percent1: 78, skill2: '스킬 D', percent2: 22 },
                    { slot: 'VP 슬롯 3', slotPercent: 72, skill1: '스킬 E', percent1: 45, skill2: '스킬 F', percent2: 55 },
                    { slot: 'VP 슬롯 4', slotPercent: 65, skill1: '스킬 G', percent1: 82, skill2: '스킬 H', percent2: 18 },
                    { slot: 'VP 슬롯 5', slotPercent: 58, skill1: '스킬 I', percent1: 70, skill2: '스킬 J', percent2: 30 },
                    { slot: 'VP 슬롯 6', slotPercent: 45, skill1: '스킬 K', percent1: 55, skill2: '스킬 L', percent2: 45 },
                    { slot: 'VP 슬롯 7', slotPercent: 32, skill1: '스킬 M', percent1: 60, skill2: '스킬 N', percent2: 40 },
                    { slot: 'VP 슬롯 8', slotPercent: 18, skill1: '스킬 O', percent1: 50, skill2: '스킬 P', percent2: 50 },
                  ].map((data, i) => (
                    <div key={i} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-gray-500">{data.slot}</span>
                        <span className="text-xs font-bold text-green-600">{data.slotPercent}% 사용</span>
                      </div>

                      {/* 스킬 1 */}
                      <div className="mb-1">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-xs font-medium text-gray-700">{data.skill1}</span>
                          <span className="text-xs font-bold text-blue-600">{data.percent1}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-1 rounded-full transition-all"
                            style={{ width: `${data.percent1}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* 스킬 2 */}
                      <div>
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-xs font-medium text-gray-700">{data.skill2}</span>
                          <span className="text-xs font-bold text-purple-600">{data.percent2}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-purple-600 h-1 rounded-full transition-all"
                            style={{ width: `${data.percent2}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* 푸터 */}
      <Footer />
    </div>
  );
}
