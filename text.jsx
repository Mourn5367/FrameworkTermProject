import React, { useState } from 'react';
import { Server, Database, Zap, Cloud, Activity, Code, Globe, Lock, Clock, RefreshCw, Box } from 'lucide-react';

export default function ArchitectureDiagram() {
  const [hoveredBox, setHoveredBox] = useState(null);

  const Box = ({ title, items, icon: Icon, color, gradient, id, position }) => (
    <div 
      className={`relative ${position}`}
      onMouseEnter={() => setHoveredBox(id)}
      onMouseLeave={() => setHoveredBox(null)}
    >
      <div className={`
        bg-gradient-to-br ${gradient} 
        rounded-2xl p-6 shadow-xl 
        transform transition-all duration-300 hover:scale-105 hover:shadow-2xl
        border-2 ${hoveredBox === id ? 'border-white' : 'border-white/20'}
        backdrop-blur-sm
      `}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg bg-white/20`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li key={idx} className="text-white/90 text-sm flex items-start gap-2">
              <span className="text-white/60 mt-1">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const Arrow = ({ from, to, label, dashed }) => (
    <div className="absolute pointer-events-none">
      <div className={`text-xs font-semibold text-white/80 bg-gray-900/50 px-3 py-1 rounded-full backdrop-blur-sm border border-white/20`}>
        {label}
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            던파 경매장 시스템 아키텍처
          </h1>
          <p className="text-white/60 text-lg">Real-time Auction System Architecture</p>
        </div>

        {/* Architecture Layout */}
        <div className="relative space-y-8">
          
          {/* Frontend Layer */}
          <div className="flex justify-center">
            <Box 
              id="frontend"
              title="Next.js Frontend"
              icon={Globe}
              gradient="from-cyan-500 to-blue-600"
              items={[
                "⚡ SSR (Server-Side Rendering)",
                "🔄 TanStack Query (API 캐싱)",
                "📡 WebSocket (실시간 알림)"
              ]}
              position="w-96"
            />
          </div>

          {/* Connection Line */}
          <div className="flex justify-center">
            <div className="w-1 h-12 bg-gradient-to-b from-blue-400 to-green-400 rounded-full shadow-lg shadow-blue-500/50"></div>
          </div>

          {/* API Gateway Layer */}
          <div className="flex justify-center">
            <Box 
              id="gateway"
              title="Spring Boot API Gateway"
              icon={Server}
              gradient="from-green-500 to-emerald-600"
              items={[
                "🔐 JWT Authentication",
                "⏱️ Rate Limiting",
                "🔄 API Proxy (던파 API)",
                "📊 Request Logging & Monitoring"
              ]}
              position="w-96"
            />
          </div>

          {/* Connection Lines - Multiple */}
          <div className="flex justify-center gap-4">
            <div className="w-1 h-12 bg-gradient-to-b from-green-400 to-purple-400 rounded-full"></div>
            <div className="w-1 h-12 bg-gradient-to-b from-green-400 to-red-400 rounded-full"></div>
            <div className="w-1 h-12 bg-gradient-to-b from-green-400 to-orange-400 rounded-full"></div>
            <div className="w-1 h-12 bg-gradient-to-b from-green-400 to-yellow-400 rounded-full"></div>
          </div>

          {/* Data & Services Layer */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Box 
              id="postgres"
              title="PostgreSQL"
              icon={Database}
              gradient="from-purple-500 to-purple-700"
              items={[
                "👤 사용자 데이터",
                "💰 경매 히스토리",
                "📈 통계 데이터"
              ]}
              position=""
            />
            
            <Box 
              id="redis"
              title="Redis"
              icon={Zap}
              gradient="from-red-500 to-red-700"
              items={[
                "⚡ 실시간 캐싱",
                "🔥 세션 관리",
                "📊 Rate Limit 저장"
              ]}
              position=""
            />
            
            <Box 
              id="dnf-api"
              title="던파 API"
              icon={Cloud}
              gradient="from-orange-500 to-orange-700"
              items={[
                "🎮 캐릭터 정보",
                "🏪 경매장 데이터",
                "⏰ 5분마다 크롤링"
              ]}
              position=""
            />
            
            <Box 
              id="ai"
              title="AI API"
              icon={Code}
              gradient="from-yellow-500 to-amber-600"
              items={[
                "🤖 Claude/OpenAI",
                "📊 캐릭터 비교 분석",
                "💡 추천 시스템"
              ]}
              position=""
            />
          </div>

          {/* Background Workers */}
          <div className="flex justify-center mt-8">
            <Box 
              id="workers"
              title="Background Workers"
              icon={Activity}
              gradient="from-pink-500 to-rose-600"
              items={[
                "🤖 Auction Crawler (@Scheduled)",
                "🚨 Price Alert (실시간 모니터링)"
              ]}
              position="w-full max-w-2xl"
            />
          </div>

        </div>

        {/* Docker Infrastructure */}
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-sm rounded-2xl border-2 border-blue-400/30">
          <div className="flex items-center gap-3 mb-4">
            <Box className="w-8 h-8 text-blue-400" />
            <h3 className="text-white font-bold text-xl">🐳 Docker Container Architecture</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <div className="text-cyan-400 font-bold mb-2">📦 Frontend Container</div>
              <div className="text-white/70">
                • Image: node:20-alpine<br/>
                • Port: 3000<br/>
                • Volume: /app
              </div>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <div className="text-green-400 font-bold mb-2">📦 Backend Container</div>
              <div className="text-white/70">
                • Image: openjdk:17-slim<br/>
                • Port: 8080<br/>
                • Network: bridge
              </div>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <div className="text-purple-400 font-bold mb-2">📦 Database Containers</div>
              <div className="text-white/70">
                • PostgreSQL: 5432<br/>
                • Redis: 6379<br/>
                • Volume: persistent
              </div>
            </div>
          </div>
          <div className="mt-4 text-white/60 text-xs">
            💡 All services run in isolated Docker containers with docker-compose orchestration
          </div>
        </div>

        {/* Legend */}
        <div className="mt-12 p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
          <h3 className="text-white font-bold mb-4 text-lg">📌 기술 스택</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
              <span className="text-white/80">Frontend: Next.js 14</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-white/80">Backend: Spring Boot 3</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-white/80">Database: PostgreSQL</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-white/80">Cache: Redis</span>
            </div>
          </div>
        </div>

        {/* Info Box */}
        {hoveredBox && (
          <div className="fixed bottom-8 right-8 p-4 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 shadow-2xl max-w-xs">
            <p className="text-white/90 text-sm">
              {hoveredBox === 'frontend' && '사용자 인터페이스를 담당하는 프론트엔드 레이어입니다.'}
              {hoveredBox === 'gateway' && 'API 요청을 중계하고 인증을 처리하는 게이트웨이입니다.'}
              {hoveredBox === 'postgres' && '영구 데이터를 저장하는 메인 데이터베이스입니다.'}
              {hoveredBox === 'redis' && '빠른 응답을 위한 인메모리 캐시 시스템입니다.'}
              {hoveredBox === 'dnf-api' && '던전앤파이터 공식 API와 통신합니다.'}
              {hoveredBox === 'ai' && 'AI를 활용한 캐릭터 분석 및 추천 기능입니다.'}
              {hoveredBox === 'workers' && '백그라운드에서 실행되는 작업 프로세스들입니다.'}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}