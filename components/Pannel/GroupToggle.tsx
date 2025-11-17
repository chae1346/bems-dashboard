"use client";

import { useState } from "react";

interface GroupToggleProps {
  onChange?: (value: boolean) => void;
}

export default function GroupToggle({ onChange }: GroupToggleProps) {
  const [on, setOn] = useState(false);

  const toggle = () => {
    const next = !on;
    setOn(next);
    onChange?.(next);
  };

  return (
    <button
      onClick={toggle}
      className={`
        relative w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300
        ${on ? "bg-black" : "bg-gray-300"}
      `}
    >
      {/* 움직이는 하얀 원 */}
      <div
        className={`
          w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 z-10
          ${on ? "translate-x-6" : "translate-x-0"}
        `}
      />

      {/* 텍스트: 그룹 (켜졌을 때 보임) */}
      <span 
        className={`
          absolute left-2 text-[8px] font-bold text-white transition-opacity duration-300
          ${on ? "opacity-100" : "opacity-0"}
        `}
      >
        그룹
      </span>

      {/* 텍스트: 개별 (꺼졌을 때 보임) */}
      <span 
        className={`
          absolute right-2 text-[8px] font-bold text-gray-600 transition-opacity duration-300
          ${!on ? "opacity-100" : "opacity-0"}
        `}
      >
        개별
      </span>
    </button>
  );
}