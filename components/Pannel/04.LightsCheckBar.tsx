"use client";

import { useState, useMemo } from "react";
import GroupToggle from "./GroupToggle";
import LightStatusBar from "./LightStatusBar";

interface LightInfo {
  id: string;
  label: string;
  brightness: number;
}

export default function LightsCheckBar() {
  const [groupMode, setGroupMode] = useState(false);

  const lights: LightInfo[] = [
    { id: "L1", label: "L1", brightness: 30 },
    { id: "L2", label: "L2", brightness: 30 },
    { id: "L3", label: "L3", brightness: 30 },
    { id: "M1", label: "M1", brightness: 30 },
    { id: "M2", label: "M2", brightness: 30 },
    { id: "M3", label: "M3", brightness: 30 },
    { id: "R1", label: "R1", brightness: 30 },
    { id: "R2", label: "R2", brightness: 30 },
    { id: "R3", label: "R3", brightness: 30 },
  ];

  const groupedLights = useMemo(() => {
    return [
      {
        id: "L",
        label: "L",
        brightness: avg([lights[0], lights[1], lights[2]]),
      },
      {
        id: "M",
        label: "M",
        brightness: avg([lights[3], lights[4], lights[5]]),
      },
      {
        id: "R",
        label: "R",
        brightness: avg([lights[6], lights[7], lights[8]]),
      },
    ];
  }, [lights]);

  const displayLights = groupMode ? groupedLights : lights;

  return (
    <div className="flex items-center gap-4 bg-white rounded-xl px-4 py-3 shadow-sm">

      <div className="flex items-center gap-2 whitespace-nowrap">
        <span className="text-sm font-medium text-gray-700">
          전구 밝기 확인
        </span>
        <GroupToggle onChange={setGroupMode} />
      </div>

      <div className="h-6 w-px bg-gray-200" />

      <div className="flex-1 overflow-x-auto">
        <LightStatusBar lights={displayLights} />
      </div>
    </div>
  );
}

function avg(arr: LightInfo[]) {
  return Math.round(
    arr.reduce((sum, l) => sum + l.brightness, 0) / arr.length
  );
}
