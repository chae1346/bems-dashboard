"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Title } from "@/components/Title"; // 활성화
import { Controller } from "@/components/Pannel/01.Controller";
import Notification from "@/components/Pannel/04.Notification";
import SensorBar from "@/components/Pannel/02.SensorBar";
import { LightGrid } from "@/components/Pannel/03.LightGrid";
import { TandemViewer } from "@/utils/tandemViewer";

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
  const isMounted = useRef(false);
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const viewerInitialized = useRef(false);

  // ==============================
  // [I. 모니터링]
  // ==============================

  // 1. 현재 센서/조명 상태 가져오기 (GET)
  const fetchSensorData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/Sensor");

      if (!response.ok) {
        throw new Error(
          `데이터를 가져오는 데 실패했습니다: ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log("센서 데이터를 가져왔습니다. ", {
        sensors: result.sensors?.length,
        lights: result.lights?.length,
      });
      const newSensorData: SensorStatusData = {
        sensors: (result.sensors || result.sensor || []) as SingleSensor[],
        timestamp: result.timestamp || new Date().toISOString(),
      };

      const newLightLevels: LightLevel[] = (result.lights ||
        []) as LightLevel[];

      setSensorData(newSensorData);
      setLightLevels(newLightLevels);
    } catch (err) {
      console.error("센서 데이터 Fetch 에러:", err);
      setError("데이터 통신 중 에러가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. 10초마다 상태 업데이트 (Polling)
  useEffect(() => {
    console.log("기기 상태를 업데이트 합니다.");
    fetchSensorData();

    const intervalId = setInterval(fetchSensorData, 10000); 
    return () => clearInterval(intervalId);
  }, [fetchSensorData]);

  // ==============================
  // [II. 제어]
  // ==============================

  // 1. 조명 제어 실행 (POST)
  const handleControlSubmit = useCallback(
    async (levelL: number, levelC: number, levelR: number) => {
      setIsLoading(true);
      setError(null);
      console.log("제어 명령을 전송합니다.");
      try {
        const response = await fetch("/api/control", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ levelL: levelL, levelC: levelC, levelR: levelR }),
        });

        if (!response.ok) {
          throw new Error(`제어 명령 전송 실패: ${response.statusText}`);
        }
        console.log("제어 명령 전송을 성공했습니다.");
        await fetchSensorData();
      } catch (err) {
        console.error("제어 명령 전송 에러:", err);
        setError("조도 제어 명령 전송 중 에러가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    },
    [fetchSensorData]
  );

  // 2. 제어 트리거
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      console.log("최초 마운트를 성공했습니다.");
      return;
    }

    const carculationAndControl = async () => {
      if (targetLux === null || targetLux === undefined) return;
      console.log(`[PAGE] 설정 조도값이 입력되었습니다: ${targetLux}`);

      // 1) 파이썬 계산 API 호출
      try {
        const calcResponse = await fetch("/api/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetLux: targetLux }),
        });

        if (!calcResponse.ok) {
          throw new Error(`계산 API 실패: ${calcResponse.statusText}`);
        }

        const result = await calcResponse.json();
        console.log("[PAGE] 조도값에 따라 조명 밝기 레벨을 계산하였습니다.");
        // result는 { levelW: 10, levelR: 60 } 형태여야 함.

        // 2) 계산된 결과를 받아 handleControlSubmit으로 제어 시작
        await handleControlSubmit(result.levelL, result.levelC, result.levelR);
      } catch (e) {
        console.error("제어 루프 중 계산 실패:", e);
        setError("자동 제어 계산 중 오류가 발생했습니다.");
        console.error("제어 루프 중 계산 실패:", e);
        setError("자동 제어 계산 중 오류가 발생했습니다.");
      }
    };
    carculationAndControl();
  }, [targetLux, handleControlSubmit]);

  useEffect(() => {
    if (viewerInitialized.current) return;

    let checkInterval: NodeJS.Timeout | null = null;
    let containerCheckInterval: NodeJS.Timeout | null = null;
    let timeoutCount = 0;
    const MAX_TIMEOUT = 50;

    const initViewer = async () => {
      if (viewerInitialized.current) return;
      try {
        if (typeof window === "undefined") return;

        const checkAutodesk = () => {
          return (
            (window as any).Autodesk?.Viewing &&
            (window as any).Autodesk?.Tandem?.DtApp
          );
        };

        if (!checkAutodesk()) {
          timeoutCount++;
          if (timeoutCount > MAX_TIMEOUT) {
            console.error("Autodesk SDK 로딩 타임아웃");
            setError("Autodesk SDK 로딩 실패");
            return;
          }
          checkInterval = setInterval(() => {
            if (checkAutodesk()) {
              if (checkInterval) clearInterval(checkInterval);
              initViewer();
            }
          }, 200);
          return;
        }

        console.log("뷰어 초기화 중...");
        const viewer = TandemViewer.instance;
        await viewer.initialize(viewerContainerRef.current!);

        const targetUrn = process.env.NEXT_PUBLIC_FACILITY_URN;
        if (targetUrn) {
          try {
            await viewer.openFacilityByUrn(targetUrn);
            viewer.setupViewerOptions();
            console.log("모델 로드 완료");
          } catch (facilityError) {
            console.error("모델 로드 실패:", facilityError);
            setError(
              `모델 로드 실패: ${
                facilityError instanceof Error
                  ? facilityError.message
                  : "Unknown error"
              }`
            );
          }
        } else {
          console.warn("NEXT_PUBLIC_FACILITY_URN이 설정되지 않았습니다");
        }

        viewerInitialized.current = true;
      } catch (err) {
        console.error("뷰어 초기화 실패:", err);
        setError(
          `뷰어 초기화 실패: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      }
    };

    const waitForContainer = () => {
      if (viewerContainerRef.current) {
        if (containerCheckInterval) clearInterval(containerCheckInterval);
        return true;
      }
      return false;
    };

    if (!waitForContainer()) {
      containerCheckInterval = setInterval(() => {
        if (waitForContainer()) {
          initViewer();
        }
      }, 100);
      return () => {
        if (checkInterval) clearInterval(checkInterval);
        if (containerCheckInterval) clearInterval(containerCheckInterval);
      };
    }

    initViewer();

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (containerCheckInterval) clearInterval(containerCheckInterval);
    };
  }, []);
  }, [targetLux, handleControlSubmit]);

  useEffect(() => {
    if (viewerInitialized.current) return;

    let checkInterval: NodeJS.Timeout | null = null;
    let containerCheckInterval: NodeJS.Timeout | null = null;
    let timeoutCount = 0;
    const MAX_TIMEOUT = 50;

    const initViewer = async () => {
      if (viewerInitialized.current) return;
      try {
        if (typeof window === "undefined") return;

        const checkAutodesk = () => {
          return (
            (window as any).Autodesk?.Viewing &&
            (window as any).Autodesk?.Tandem?.DtApp
          );
        };

        if (!checkAutodesk()) {
          timeoutCount++;
          if (timeoutCount > MAX_TIMEOUT) {
            console.error("Autodesk SDK 로딩 타임아웃");
            setError("Autodesk SDK 로딩 실패");
            return;
          }
          checkInterval = setInterval(() => {
            if (checkAutodesk()) {
              if (checkInterval) clearInterval(checkInterval);
              initViewer();
            }
          }, 200);
          return;
        }

        console.log("뷰어 초기화 중...");
        const viewer = TandemViewer.instance;
        await viewer.initialize(viewerContainerRef.current!);

        const targetUrn = process.env.NEXT_PUBLIC_FACILITY_URN;
        if (targetUrn) {
          try {
            await viewer.openFacilityByUrn(targetUrn);
            viewer.setupViewerOptions();
            console.log("모델 로드 완료");
          } catch (facilityError) {
            console.error("모델 로드 실패:", facilityError);
            setError(
              `모델 로드 실패: ${
                facilityError instanceof Error
                  ? facilityError.message
                  : "Unknown error"
              }`
            );
          }
        } else {
          console.warn("NEXT_PUBLIC_FACILITY_URN이 설정되지 않았습니다");
        }

        viewerInitialized.current = true;
      } catch (err) {
        console.error("뷰어 초기화 실패:", err);
        setError(
          `뷰어 초기화 실패: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      }
    };

    const waitForContainer = () => {
      if (viewerContainerRef.current) {
        if (containerCheckInterval) clearInterval(containerCheckInterval);
        return true;
      }
      return false;
    };

    if (!waitForContainer()) {
      containerCheckInterval = setInterval(() => {
        if (waitForContainer()) {
          initViewer();
        }
      }, 100);
      return () => {
        if (checkInterval) clearInterval(checkInterval);
        if (containerCheckInterval) clearInterval(containerCheckInterval);
      };
    }

    initViewer();

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (containerCheckInterval) clearInterval(containerCheckInterval);
    };
  }, []);

  // ==============================
  // [III. UI]
  // ==============================

  // 1. 로딩/에러 메시지
  if (isLoading && !sensorData) {
    return (
      <div className="flex justify-center items-center h-screen text-xl">
        시스템 데이터 로딩 중...
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-600 text-xl">
        에러 발생: {error}
      </div>
    );
  }

  // 2. 메인 UI 렌더링
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
            <div className="bg-white rounded-xl shadow-md p-3 shrink-0 pointer-events-auto">
              <Controller value={targetLux} onValueChange={setTargetLux} />
            </div>

            {/* SensorBar */}
            <div className="bg-white rounded-xl shadow-md p-0 flex-none min-h-0 overflow-hidden flex flex-col">
              <SensorBar targetLux={targetLux} sensorData={sensorData} />
            </div>

            {/* LightGrid */}
            <div className="bg-white rounded-xl shadow-md p-3 shrink-0 pointer-events-auto">
              <LightGrid lightLevels={lightLevels} />
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
        <div
          ref={viewerContainerRef}
          className="w-full h-full"
          style={{ position: "absolute", inset: 0 }}
        />
      </main>
    </div>
  );
}
