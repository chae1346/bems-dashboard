"use client";

import { useState, useEffect, useCallback } from "react";
import { Title } from "@/components/Title"; // 활성화
import { Controller } from "@/components/Pannel/01.Controller";
import Notification from "@/components/Pannel/04.Notification"; // 활성화
import SensorBar from "@/components/Pannel/02.SensorBar";
import { LightGrid } from "@/components/Pannel/03.LightGrid";

// 타입 정의
type SingleSensor = {
  id: string;
  name: string;
  lux: number;
};

type SensorStatusData = {
  sensors: SingleSensor[];
  timestamp: string;
};

type LightLevel = {
  id: string;
  name: string;
  brightness: number; // 0 (Off) ~ 100 (Max)
};

export default function Home() {
  // 센서 상태 정의
  const [targetLux, setTargetLux] = useState(150); // Controller에서 입력받는 목표 조도
  const [sensorData, setSensorData] = useState<SensorStatusData | null>(null); // api/Sensor GET 결과 (현재 조도값)
  const [lightLevels, setLightLevels] = useState<LightLevel[]>([]); // api/Sensor GET 결과 (각 조명의 밝기 레벨)
  const [isLoading, setIsLoading] = useState(true); // 로딩 상태
  const [error, setError] = useState<string | null>(null); // 에러 상태

  // 1. 현재 센서/조명 상태 가져오기 (GET)
  const fetchSensorData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/Sensor'); 
      
      if (!response.ok) {
        throw new Error(`데이터를 가져오는 데 실패했습니다: ${response.statusText}`);
      }
      
      const result = await response.json(); // API 응답 전체를 JSON으로 가져오기
      
      // API 응답에서 'sensors' 배열 키와 'timestamp' 키 추출
      const newSensorData: SensorStatusData = {
        sensors: (result.sensors || result.sensor || []) as SingleSensor[],
        timestamp: result.timestamp || new Date().toISOString(),
      };
      
      // API 응답에서 'lights' 배열 키를 추출
      const newLightLevels: LightLevel[] = (result.lights || []) as LightLevel[];

      setSensorData(newSensorData);
      setLightLevels(newLightLevels);
      
    } catch (err) {
      console.error("센서 데이터 Fetch 에러:", err);
      setError("데이터 통신 중 에러가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. 원하는 조도값 전송 (POST)
  const handleControlSubmit = useCallback(async (desiredLux: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ desiredLux }),
      });

      if (!response.ok) {
        throw new Error(`제어 명령 전송 실패: ${response.statusText}`);
      }
      
      await fetchSensorData(); 

    } catch (err) {
      console.error("제어 명령 전송 에러:", err);
      setError("조도 제어 명령 전송 중 에러가 발생했습니다.");
    } finally {
      setIsLoading(false); 
    }
  }, [fetchSensorData]);

  // 3. 5초마다 상태 업데이트 (Polling)
  useEffect(() => {
    fetchSensorData();

    const intervalId = setInterval(fetchSensorData, 5000); 
    return () => clearInterval(intervalId);
  }, [fetchSensorData]);

  // 4. targetLux 값이 변경될 때마다 자동 제어 API 호출
  useEffect(() => {
      if (targetLux !== null && targetLux !== undefined) {
          handleControlSubmit(targetLux);
      }
      
  }, [targetLux, handleControlSubmit]);

  // 5. 로딩/에러 표시
  if (isLoading && !sensorData) {
    return <div className="flex justify-center items-center h-screen text-xl">시스템 데이터 로딩 중...</div>;
  }
  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-600 text-xl">에러 발생: {error}</div>;
  }
  
  // 6. UI
  return (
    <div className="relative w-full h-screen overflow-hidden bg-zinc-50 font-sans dark:bg-black">

      {/* Overlay */}
      <div className="absolute inset-0 z-10 p-4 pointer-events-none flex flex-col">
        
        {/*
        <div className="w-full flex justify-center mb-2 pointer-events-auto">
          <Title />
        </div>*/}

        {/* Pannel */}
        <div className="flex flex-row gap-4 h-full min-h-0">
          
          {/* LEFT */}
          <div className="w-[260px] lg:w-[320px] transition-all duration-300 flex flex-col gap-3 flex-none pointer-events-auto min-w-0 pb-4">
            
            {/* Controller */}
            <div className="bg-white rounded-xl shadow-md p-3 shrink-0">
               <Controller 
                 value={targetLux} 
                 onValueChange={setTargetLux}
               />
            </div>

            {/* SensorBar */}
            <div className="bg-white rounded-xl shadow-md p-0 flex-none min-h-0 overflow-hidden flex flex-col">
               <SensorBar 
                 targetLux={targetLux} 
                 sensorData={sensorData}
               />
            </div>

            {/* LightGrid */}
            <div className="bg-white rounded-xl shadow-md p-3 shrink-0">
               <LightGrid 
                 lightLevels={lightLevels}
               />
            </div>

          </div>


          {/* [RIGHT AREA] 우측 영역 */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="pointer-events-auto">
              <Notification />
            </div>
            <div className="flex-1"></div>
          </div>

        </div>
      </div>

      {/* [Background] */}
      <main className="absolute inset-0 z-0">
        {/*<TandemViewer />*/}
      </main>
      
    </div>
  );
}