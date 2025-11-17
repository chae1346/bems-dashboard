"use client";

import React, { useState } from 'react';

interface LightState {
  id: string; label: string; group: 'Left' | 'Middle' | 'Right'; brightness: number;
}

export function LightGrid() {
  const [viewMode, setViewMode] = useState<'grid' | 'group'>('grid');

  const lights: LightState[] = [
    { id: "L1", label: "L1", group: "Left", brightness: 100 }, { id: "L2", label: "L2", group: "Left", brightness: 90 }, { id: "L3", label: "L3", group: "Left", brightness: 45 },
    { id: "M1", label: "M1", group: "Middle", brightness: 95 }, { id: "M2", label: "M2", group: "Middle", brightness: 75 }, { id: "M3", label: "M3", group: "Middle", brightness: 20 },
    { id: "R1", label: "R1", group: "Right", brightness: 55 }, { id: "R2", label: "R2", group: "Right", brightness: 40 }, { id: "R3", label: "R3", group: "Right", brightness: 0 },
  ];

  const leftLights = lights.filter(l => l.group === 'Left');
  const centerLights = lights.filter(l => l.group === 'Middle');
  const rightLights = lights.filter(l => l.group === 'Right');

  const getAverage = (list: LightState[]) => {
    if (list.length === 0) return 0;
    return Math.round(list.reduce((acc, curr) => acc + curr.brightness, 0) / list.length);
  };

  return (
    <div className="w-full flex flex-col h-full">
      
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <h3 className="text-xs font-bold text-gray-600">전구 밝기 확인</h3>
        <div className="flex bg-gray-100 rounded p-0.5">
          <button onClick={() => setViewMode('grid')} className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all ${viewMode === 'grid' ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}>개별</button>
          <button onClick={() => setViewMode('group')} className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all ${viewMode === 'group' ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}>그룹</button>
        </div>
      </div>

      {/* 컨텐츠: min-h 축소 */}
      <div className="flex-1 min-h-[140px]">
        
        {viewMode === 'grid' && (
          <div className="grid grid-cols-3 gap-2 h-full">
            <div className="flex flex-col gap-1"><span className="text-[9px] text-center font-bold text-gray-300">L</span>{leftLights.map(l => <LightItem key={l.id} light={l} />)}</div>
            <div className="flex flex-col gap-1"><span className="text-[9px] text-center font-bold text-gray-300">M</span>{centerLights.map(l => <LightItem key={l.id} light={l} />)}</div>
            <div className="flex flex-col gap-1"><span className="text-[9px] text-center font-bold text-gray-300">R</span>{rightLights.map(l => <LightItem key={l.id} light={l} />)}</div>
          </div>
        )}

        {viewMode === 'group' && (
          <div className="grid grid-cols-3 gap-2 h-full">
             <GroupPillar title="L" avg={getAverage(leftLights)} />
             <GroupPillar title="M" avg={getAverage(centerLights)} />
             <GroupPillar title="R" avg={getAverage(rightLights)} />
          </div>
        )}
      </div>
    </div>
  );
}

const getDynamicYellowStyle = (brightness: number) => {
  if (brightness === 0) return { background: '#f3f4f6', color: '#9ca3af', boxShadow: 'none' };
  const alpha = 0.2 + (brightness / 100) * 0.8; 
  return {
    backgroundColor: `rgba(250, 204, 21, ${alpha})`,
    color: '#422006',
    boxShadow: `0 0 ${brightness / 4}px rgba(250, 204, 21, 0.5)` // glow 줄임
  };
};

function LightItem({ light }: { light: LightState }) {
  return (
    <div style={getDynamicYellowStyle(light.brightness)} className="flex flex-col items-center justify-center py-1 rounded flex-1 cursor-pointer transition-transform hover:scale-105">
      <span className="text-[9px] font-medium opacity-80 leading-none mb-0.5">{light.label}</span>
      <span className="text-xs font-bold leading-none">{light.brightness}</span>
    </div>
  );
}

function GroupPillar({ title, avg }: { title: string, avg: number }) {
  return (
    <div className="flex flex-col h-full">
      <span className="text-[9px] text-center font-bold text-gray-400 mb-1">{title}</span>
      <div className="flex-1 bg-gray-100 rounded-lg relative overflow-hidden flex flex-col justify-end group hover:ring-1 ring-gray-200">
        <div className="w-full transition-all duration-500 ease-out" style={{ height: `${avg}%`, backgroundColor: `rgba(250, 204, 21, ${0.3 + (avg / 100) * 0.7})` }} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <span className="text-sm font-bold text-yellow-900 drop-shadow-sm">{avg}%</span>
        </div>
      </div>
    </div>
  );
}