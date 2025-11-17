"use client";

import { useState } from "react";

type PresetMode = "일반" | "수업" | "발표" | "자습";

// 부모로부터 받을 Props 정의
interface ControllerProps {
  value: number;
  onValueChange: (newValue: number) => void;
}

export function Controller({ value, onValueChange }: ControllerProps) {
  // 프리셋 UI 상태는 내부에서 관리해도 됨 (스타일링용)
  const [activePreset, setActivePreset] = useState<PresetMode>("일반");
  
  const modes: { label: PresetMode; lux: number }[] = [
    { label: "일반", lux: 150 },
    { label: "수업", lux: 500 },
    { label: "발표", lux: 300 },
    { label: "자습", lux: 1000 },
  ];

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange(Number(e.target.value));
    setActivePreset("일반"); // 슬라이더 조작 시 프리셋 표시 해제(혹은 일반으로)
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue === "") {
      onValueChange(0);
      return;
    }
    let numValue = Number(inputValue);
    if (numValue > 1500) numValue = 1500;
    if (numValue < 0) numValue = 0;
    onValueChange(numValue);
  };

  const handleBlur = () => {
    if (String(value) === "") {
      onValueChange(0);
    }
  };

  const handlePresetClick = (mode: PresetMode, lux: number) => {
    setActivePreset(mode);
    onValueChange(lux); // 부모에게 변경된 값 전달
  };

  return (
    <div className="w-full flex flex-col gap-5 px-2">
      
      <div className="w-full flex items-center gap-6">
        <div className="flex-1 flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-600">조도 값 설정</span>
          <input
            type="range"
            min={0}
            max={1500}
            value={value}
            onChange={handleSliderChange}
            className="w-full accent-black cursor-pointer h-2 bg-gray-200 rounded-lg appearance-none"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>0 lx</span>
            <span>1500 lx</span>
          </div>
        </div>

        <div className="flex items-baseline justify-end gap-1 min-w-[100px]">
          <input
            type="number"
            value={value}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className="
              w-22 text-right text-4xl font-bold text-gray-900 
              bg-transparent outline-none border-none p-0 m-0
              focus:ring-0 appearance-none 
              [&::-webkit-inner-spin-button]:appearance-none
            " 
          />
          <span className="text-lg font-medium text-gray-500">lx</span>
        </div>
      </div>

      <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 w-full">
        {modes.map((m) => (
          <button
            key={m.label}
            onClick={() => handlePresetClick(m.label, m.lux)}
            className={`
              px-3 py-2 rounded-lg text-sm font-bold transition-colors
              ${m.label === "일반" ? "col-span-3 lg:col-span-1" : "col-span-1"}
              
              ${activePreset === m.label
                ? "bg-black text-white shadow-sm" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }
            `}
          >
            {m.label}
          </button>
        ))}
      </div>

    </div>
  );
}