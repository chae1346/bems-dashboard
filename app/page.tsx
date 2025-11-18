"use client";

import { useState } from "react"; // [추가됨] 상태 관리용
import { Title } from "@/components/Title";
import { Controller } from "@/components/Pannel/01.Controller"; 
import LightsCheckBar from "@/components/Pannel/04.LightsCheckBar";
import SensorSidebar from "@/components/Pannel/02.SensorBar"; 
import { LightGrid } from "@/components/Pannel/03.LightsGrid";

export default function Home() {
  const [targetLux, setTargetLux] = useState(150);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-zinc-50 font-sans dark:bg-black">

      {/* [UI Overlay] */}
      <div className="absolute inset-0 z-10 p-4 pointer-events-none flex flex-col">
        
        {/* 1. [Title] */}
        {/*
        <div className="w-full flex justify-center mb-2 pointer-events-auto">
          <Title />
        </div>
        */}

        {/* 2. [Main Layout] */}
        <div className="flex flex-row gap-4 h-full min-h-0">
          
          {/* [LEFT DOCK] 왼쪽 패널 */}
          <div className="w-[260px] lg:w-[320px] transition-all duration-300 flex flex-col gap-3 flex-none pointer-events-auto min-w-0 pb-4">
            
            {/* (1) Controller: 고정 높이 */}
            <div className="bg-white rounded-xl shadow-md p-3 shrink-0">
               <Controller value={targetLux} onValueChange={setTargetLux} />
            </div>

            {/* (2) SensorSidebar: 가변 높이 (남는 공간 차지) */}
            <div className="bg-white rounded-xl shadow-md p-0 flex-none min-h-0 overflow-hidden flex flex-col">
               <SensorSidebar targetLux={targetLux} />
            </div>

            {/* (3) LightGrid: 고정 높이 */}
            <div className="bg-white rounded-xl shadow-md p-3 shrink-0">
               <LightGrid />
            </div>

          </div>


          {/* [RIGHT AREA] 우측 영역 */}
          <div className="flex-1 flex flex-col min-w-0">
             <div className="pointer-events-auto">
                <LightsCheckBar />
             </div>
             <div className="flex-1"></div>
          </div>

        </div>
      </div>

      {/* [Background] */}
      <main className="absolute inset-0 z-0">
         {/* <TandemViewer /> */}
      </main>
      
    </div>
  );
}