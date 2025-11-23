"use client";

import { useState, useEffect } from "react";

// 💡 [Type Definition]
type SingleSensor = {
  id: string;
  name: string;
  lux: number;
};

// 💡 [Props Definition]
interface SensorBarProps {
  targetLux: number;
  sensorData: { sensors: SingleSensor[]; timestamp: string; } | null;
}

// 💡 [Internal State]
interface GraphSensorData extends SingleSensor {
  history: number[];
  color: string;
}

// 💡 [Static Color Map]
const STATIC_SENSOR_COLORS: { [key: string]: string } = {
  "S1": "#ef4444",
  "S2": "#f97316",
  "S3": "#eab308"
};

export default function SensorSidebar({ targetLux, sensorData }: SensorBarProps) {
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  const [graphSensors, setGraphSensors] = useState<GraphSensorData[]>([]);

  // 설정값
  const maxDataPoints = 20;
  const MIN_Y = 0;
  const MAX_Y = 300;

  // ⭐️ [로직 수정]: 히스토리 누적 로직 개선
  useEffect(() => {
    if (!sensorData || sensorData.sensors.length === 0) return;

    setGraphSensors((prevGraphSensors) => {
      // 이번 턴에 들어온 새로운 센서 데이터들
      const newSensorsData = sensorData.sensors;

      // 기존 상태(prevGraphSensors)가 비어있다면(첫 로딩), 초기화만 진행
      if (prevGraphSensors.length === 0) {
        return newSensorsData.map((apiSensor) => ({
          ...apiSensor,
          color: STATIC_SENSOR_COLORS[apiSensor.id] || STATIC_SENSOR_COLORS["S1"] || "#3b82f6",
          history: [apiSensor.lux], // 첫 데이터 하나만 넣음
        }));
      }

      // 기존 상태가 있다면, ID를 기준으로 매칭해서 히스토리 업데이트
      return prevGraphSensors.map((prevSensor) => {
        // 현재 들어온 데이터 중 같은 ID 찾기
        const matchingNewData = newSensorsData.find((s) => s.id === prevSensor.id);

        if (matchingNewData) {
          // 1. 기존 히스토리에 새 값 추가
          const updatedHistory = [...prevSensor.history, matchingNewData.lux];

          // 2. 최대 개수(20개) 넘으면 앞에서부터 자르기
          if (updatedHistory.length > maxDataPoints) {
            updatedHistory.shift(); 
          }

          return {
            ...prevSensor,
            lux: matchingNewData.lux, // 현재값 업데이트
            history: updatedHistory,   // 히스토리 업데이트
          };
        }
        
        // 매칭되는 새 데이터가 없으면 기존 상태 유지 (혹은 끊어진 그래프 처리 가능)
        return prevSensor;
      });
    });
  }, [sensorData]); // sensorData가 바뀔 때마다 실행

  // --- Helper Functions ---
  const calculateY = (val: number, min: number, max: number) => {
    let y = 100 - ((val - min) / (max - min)) * 100;
    if (y < 0) y = 0;
    if (y > 100) y = 100;
    return y;
  };

  const createScanPath = (data: number[], maxPoints: number, min: number, max: number) => {
    if (data.length < 2) return ""; // 점이 2개 이상이어야 선을 그릴 수 있음

    const points = data.map((val, i) => {
      // 데이터 개수가 적을 때도 왼쪽부터 채우지 않고, 오른쪽(최신)으로 밀리게 하려면 로직 조정 필요.
      // 여기서는 단순히 들어온 순서대로 0% -> 100% 채우는 방식 사용
      // (만약 데이터가 항상 20개가 꽉 찬 상태로 흐르게 하려면 아래 X 계산 로직을 유지하면 됩니다)
      
      // 현재 데이터의 인덱스(i)를 전체 구간(maxPoints-1)으로 나누어 X 좌표 계산
      // 데이터가 1개일 땐 0, 2개일 땐 0, 100... 이런 식이 됨.
      const x = (i / (data.length - 1)) * 100; 
      
      // 만약 데이터가 쌓이는 동안 그래프가 왼쪽에서 오른쪽으로 천천히 진행되길 원하면 위 식 사용.
      // 만약 항상 오른쪽 끝이 최신이고 데이터가 없을 땐 왼쪽이 비어있길 원하면:
      // const x = ((maxPoints - data.length + i) / (maxPoints - 1)) * 100;
      
      const y = calculateY(val, min, max);
      return `${x},${y}`;
    });

    return `M ${points.join(" L ")}`;
  };

  const yAxisTicks = [300, 250, 200, 150, 50, 0];

  // 렌더링할 데이터 결정
  const sensorsToRender = viewMode === 'graph' ? graphSensors : sensorData?.sensors || [];

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
            {sensorsToRender.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: (s as any).color || STATIC_SENSOR_COLORS[s.id] || '#3b82f6' }} />
                  <span className="font-bold text-gray-700 text-sm">{s.name}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-gray-900">{s.lux}</span>
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
                  {/* 배경 그리드 */}
                  {[0, 20, 40, 60, 80, 100].map((yPos) => (
                    <line key={yPos} x1="0" y1={yPos} x2="100" y2={yPos} stroke="#e5e7eb" strokeWidth="0.5" />
                  ))}

                  {/* Target Line */}
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
                  {graphSensors.map((s) => {
                    // 데이터가 2개 미만일 땐 점만 찍기 위해 path는 건너뜀
                    const pathD = s.history.length >= 2 ? createScanPath(s.history, maxDataPoints, MIN_Y, MAX_Y) : "";
                    
                    const lastVal = s.history[s.history.length - 1];
                    const headX = 100; // 항상 오른쪽 끝이 현재 시점이라고 가정
                    
                    // 만약 데이터 개수에 따라 점 위치도 움직이게 하려면:
                    // const headX = ((s.history.length - 1) / (s.history.length - 1 || 1)) * 100; 
                    // -> 이건 좀 복잡해지니, 위 createScanPath에서 0~100을 꽉 채우도록 했으므로 headX는 100이 맞습니다.

                    const headY = calculateY(lastVal, MIN_Y, MAX_Y);

                    return (
                      <g key={s.id}>
                        <path
                          d={pathD}
                          fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                          vectorEffect="non-scaling-stroke" className="transition-all duration-300 ease-linear"
                        />
                        {/* 현재 위치 점 */}
                        <circle cx={pathD ? 100 : 0} cy={headY} r="2" fill={s.color} className="animate-pulse" vectorEffect="non-scaling-stroke" />
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* 범례 */}
            <div className="flex flex-wrap gap-2 mt-2 justify-center shrink-0">
              {graphSensors.map(s => (
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