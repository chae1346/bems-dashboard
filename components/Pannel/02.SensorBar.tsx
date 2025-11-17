"use client";

import { useState, useEffect, useRef } from "react";

// Props 정의: 이제 이 컴포넌트는 외부에서 목표값을 받습니다.
interface SensorSidebarProps {
  targetLux: number;
}

interface SensorData {
  id: string;
  name: string;
  current: number;
  history: number[];
  color: string;
}

export default function SensorSidebar({ targetLux }: SensorSidebarProps) {
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  
  // 설정값
  // const targetLux = 150; // <-- 이거 삭제됨 (Props로 받음)
  const maxDataPoints = 20; 
  const MIN_Y = 0;
  const MAX_Y = 1500;

  // ★ 핵심: setInterval 안에서 최신 targetLux를 읽기 위한 Ref 동기화
  const targetLuxRef = useRef(targetLux);
  
  useEffect(() => {
    targetLuxRef.current = targetLux;
  }, [targetLux]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [sensors, setSensors] = useState<SensorData[]>([
    { id: "s1", name: "S1", current: 120, history: [120], color: "#ef4444" },
    { id: "s2", name: "S2", current: 115, history: [115], color: "#f97316" },
    { id: "s3", name: "S3", current: 110, history: [110], color: "#eab308" },
    { id: "s4", name: "S4", current: 125, history: [125], color: "#22c55e" },
    { id: "s5", name: "S5", current: 118, history: [118], color: "#3b82f6" },
  ]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setSensors(prev => prev.map(s => {
        const noise = (Math.random() - 0.5) * 5; 
        
        // ★ 여기서 props 대신 ref를 참조해야 실시간 반영됨
        const currentTarget = targetLuxRef.current;
        
        const step = (currentTarget - s.current) * 0.1; // 반응속도 0.2 -> 0.1로 조정 (부드럽게)
        const nextVal = Math.round(s.current + step + noise);
        
        let newHistory = [...s.history, nextVal];
        if (newHistory.length > maxDataPoints) {
          newHistory = [nextVal]; 
        }
        
        return { ...s, current: nextVal, history: newHistory };
      }));
    }, 1000); // 반응 확인을 위해 3초 -> 1초로 단축 추천

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // --- Helper Functions ---
  const calculateY = (val: number, min: number, max: number) => {
    let y = 100 - ((val - min) / (max - min)) * 100;
    if (y < 0) y = 0;
    if (y > 100) y = 100;
    return y;
  };

  const createScanPath = (data: number[], maxPoints: number, min: number, max: number) => {
    if (data.length === 0) return "";
    const points = data.map((val, i) => {
      const x = (i / (maxPoints - 1)) * 100;
      const y = calculateY(val, min, max);
      return `${x},${y}`;
    });
    return `M ${points.join(" L ")}`;
  };
  
  const yAxisTicks = [1500, 1200, 900, 600, 300, 0];

  return (
    <div className="flex flex-col w-full h-full bg-transparent select-none">
      {/* 탭 메뉴 */}
      <div className="flex border-b border-gray-200 shrink-0">
        <button onClick={() => setViewMode('list')} className={`flex-1 py-3 text-sm font-bold transition-colors ${viewMode === 'list' ? "bg-gray-50 text-black border-b-2 border-black" : "text-gray-400 hover:text-gray-600"}`}>센서 목록</button>
        <button onClick={() => setViewMode('graph')} className={`flex-1 py-3 text-sm font-bold transition-colors ${viewMode === 'graph' ? "bg-gray-50 text-black border-b-2 border-black" : "text-gray-400 hover:text-gray-600"}`}>통합 그래프</button>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="p-4 flex-1 overflow-y-auto scrollbar-hide">
        {/* 리스트 모드 */}
        {viewMode === 'list' && (
          <div className="flex flex-col gap-3">
            {sensors.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="font-bold text-gray-700 text-sm">{s.name}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-gray-900">{s.current}</span>
                  <span className="text-xs text-gray-500">lx</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 그래프 모드 */}
        {viewMode === 'graph' && (
          <div className="flex flex-col h-full min-h-[200px]">
            <div className="flex justify-between items-end mb-2 shrink-0">
              <span className="text-xs font-medium text-gray-500">실시간 스캔 (1초 주기)</span>
              <span className="text-xs font-bold text-blue-600">Target: {targetLux} lx</span>
            </div>

            <div className="flex-1 flex w-full h-full bg-gray-50/30 border border-gray-200 rounded-sm p-2">
              {/* Y축 눈금 */}
              <div className="flex flex-col justify-between text-[10px] text-gray-400 font-medium pr-2 border-r border-gray-200 mr-2 py-[2px] select-none w-10 text-right">
                {yAxisTicks.map((tick) => (
                  <span key={tick} className="leading-none">{tick}</span>
                ))}
              </div>

              {/* 그래프 SVG */}
              <div className="flex-1 relative">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {[0, 20, 40, 60, 80, 100].map((yPos) => (
                    <line key={yPos} x1="0" y1={yPos} x2="100" y2={yPos} stroke="#e5e7eb" strokeWidth="0.5" />
                  ))}

                  {/* Target Line (동적으로 움직임) */}
                  {(() => {
                    const targetY = calculateY(targetLux, MIN_Y, MAX_Y);
                    return (
                      <line 
                        x1="0" y1={targetY} x2="100" y2={targetY} 
                        stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4 2" 
                        className="transition-all duration-300"
                      />
                    );
                  })()}

                  {/* 데이터 라인 */}
                  {sensors.map((s) => {
                    const lastIdx = s.history.length - 1;
                    const headX = (lastIdx / (maxDataPoints - 1)) * 100;
                    const headY = calculateY(s.history[lastIdx], MIN_Y, MAX_Y);
                    return (
                      <g key={s.id}>
                        <path
                          d={createScanPath(s.history, maxDataPoints, MIN_Y, MAX_Y)}
                          fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                          vectorEffect="non-scaling-stroke" className="transition-all duration-500 ease-out"
                        />
                        <circle cx={headX} cy={headY} r="1.5" fill={s.color} className="animate-pulse" vectorEffect="non-scaling-stroke" />
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
            
            {/* 범례 */}
            <div className="flex flex-wrap gap-2 mt-2 justify-center shrink-0">
              {sensors.map(s => (
                <div key={s.id} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-[10px] font-medium text-gray-500">{s.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}