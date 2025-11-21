"use client";

import { useState, useEffect, useRef } from "react";

// 💡 [Type Definition]: page.tsx에서 정의한 구조에 맞게 재정의
// page.tsx의 SingleSensor와 구조를 맞춥니다.
type SingleSensor = {
    id: string;
    name: string;
    lux: number; 
};

// 💡 [Props Definition]: page.tsx에서 전달되는 sensorData를 받습니다.
interface SensorBarProps {
    targetLux: number;
    // page.tsx에서 전달받는 실제 센서 상태 배열
    sensorData: { sensors: SingleSensor[]; timestamp: string; } | null;
}

// 💡 [Internal State]: 그래프 히스토리 및 컬러를 추가한 내부 데이터 구조
interface GraphSensorData extends SingleSensor {
    history: number[];
    color: string;
}

// 💡 [Static Color Map]: 5개 고정 센서에 안정적인 색상 할당
// 백엔드에서 ID가 "s1", "s2", ... "s5"로 올 것이라 가정하고 정적 색상을 할당합니다.
const STATIC_SENSOR_COLORS: { [key: string]: string } = {
    "s1": "#ef4444", 
    "s2": "#f97316",
    "s3": "#eab308",
    "s4": "#22c55e",
    "s5": "#3b82f6",
};

// ⚠️ 컴포넌트 이름은 기존 'SensorSidebar'를 유지합니다.
export default function SensorSidebar({ targetLux, sensorData }: SensorBarProps) {
    const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');

    // 💡 [API 기반 상태]: API 데이터를 기반으로 히스토리와 색상을 보강하는 상태
    const [graphSensors, setGraphSensors] = useState<GraphSensorData[]>([]);
    
    // 설정값 (유지)
    const maxDataPoints = 20; 
    const MIN_Y = 0;
    const MAX_Y = 1500;

    // ⭐️ [로직 수정]: API 데이터를 기반으로 그래프 히스토리를 업데이트하는 useEffect
    useEffect(() => {
        // API 데이터가 없거나 센서가 없으면 아무것도 하지 않습니다.
        if (!sensorData || sensorData.sensors.length === 0) return;

        setGraphSensors(prev => {
            // API에서 온 모든 센서 데이터를 순회하며 내부 상태(prev)와 병합합니다.
            return sensorData.sensors.map(apiSensor => {
                const prevSensor = prev.find(s => s.id === apiSensor.id);
                
                if (prevSensor) {
                    // (1) 기존 센서: 히스토리 업데이트 및 컬러 유지
                    let newHistory = [...prevSensor.history, apiSensor.lux];
                    
                    // ⭐️ [오류 수정]: 길이가 초과하면 가장 오래된 데이터(앞쪽)를 자릅니다.
                    if (newHistory.length > maxDataPoints) {
                        newHistory = newHistory.slice(newHistory.length - maxDataPoints); 
                    }
                    
                    return { 
                        ...prevSensor, 
                        lux: apiSensor.lux, // 최신 lux 값 업데이트
                        history: newHistory 
                    };
                } else {
                    // (2) 새 센서 (최초 로딩 시): 고정 색상 할당 및 히스토리 초기화
                    const staticColor = STATIC_SENSOR_COLORS[apiSensor.id] || STATIC_SENSOR_COLORS.default;
                    
                    return { 
                        ...apiSensor, 
                        color: staticColor, // 고정 색상 할당
                        history: [apiSensor.lux] // 히스토리를 최신 값으로 초기화
                    };
                }
            });
        });
    }, [sensorData]); // ⭐️ page.tsx에서 sensorData가 업데이트될 때마다 실행


    // --- Helper Functions --- (유지)
    const calculateY = (val: number, min: number, max: number) => {
        let y = 100 - ((val - min) / (max - min)) * 100;
        if (y < 0) y = 0;
        if (y > 100) y = 100;
        return y;
    };

    const createScanPath = (data: number[], maxPoints: number, min: number, max: number) => {
        if (data.length === 0) return "";
        const points = data.map((val, i) => {
            // 히스토리 배열 길이에 맞춰 X 좌표 계산 (유지)
            const x = (i / (maxPoints - 1)) * 100;
            const y = calculateY(val, min, max);
            return `${x},${y}`;
        });
        return `M ${points.join(" L ")}`;
    };
    
    const yAxisTicks = [1500, 1200, 900, 600, 300, 0];
    
    // ⭐️ [렌더링 데이터]: graphSensors를 사용합니다.
    const sensorsToRender = viewMode === 'graph' ? graphSensors : sensorData?.sensors || [];


    // ⭐️ [UI/JSX 영역]: 원본 레이아웃 100% 유지 (건드리지 않음)
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
                                    {/* 💡 s.color를 사용하도록 수정. list 모드일 때는 sensorsToRender가 sensorData.sensors이므로 color가 없습니다. */}
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: (s as any).color || '#3b82f6' }} />
                                    <span className="font-bold text-gray-700 text-sm">{s.name}</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-lg font-bold text-gray-900">{s.lux}</span> {/* ⭐️ current 대신 lux 사용 */}
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
                                    {graphSensors.map((s) => {
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