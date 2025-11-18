"use client";

import { useState, useEffect } from "react";
import { Bell, AlertCircle, CheckCircle2, Info } from "lucide-react"; // 아이콘 사용 (없으면 텍스트로 대체 가능)

// 알림 메시지 타입 정의
interface Notification {
  id: number;
  type: 'info' | 'warning' | 'success';
  message: string;
  timestamp: string;
}

export default function EnvNotificationBar() {
  const [currentNoti, setCurrentNoti] = useState<Notification | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // [시뮬레이션] 실제 환경에서는 서버나 센서에서 데이터를 받아옵니다.
  useEffect(() => {
    const mockNotifications: Notification[] = [
      { id: 1, type: 'warning', message: "우방 조도 변화가 감지되었습니다.", timestamp: "10:45" },
      { id: 2, type: 'info', message: "조명 밝기를 자동으로 조절합니다. (Target: 60%)", timestamp: "10:45" },
      { id: 3, type: 'success', message: "최적 밝기 설정이 완료되었습니다.", timestamp: "10:46" },
      { id: 4, type: 'info', message: "발표 모드가 유지 중입니다.", timestamp: "11:00" },
    ];

    let index = 0;
    // 초기값 설정
    setCurrentNoti(mockNotifications[0]);

    const interval = setInterval(() => {
      setIsAnimating(true); // 페이드 아웃 시작
      
      setTimeout(() => {
        index = (index + 1) % mockNotifications.length;
        setCurrentNoti(mockNotifications[index]);
        setIsAnimating(false); // 페이드 인
      }, 300); // CSS transition 시간과 맞춤

    }, 4000); // 4초마다 메시지 변경

    return () => clearInterval(interval);
  }, []);

  // 알림 타입별 아이콘 및 색상 결정
  const getStatusStyle = (type: string) => {
    switch (type) {
      case 'warning': return { icon: <AlertCircle size={18} />, color: "text-orange-500", bg: "bg-orange-50" };
      case 'success': return { icon: <CheckCircle2 size={18} />, color: "text-green-500", bg: "bg-green-50" };
      default: return { icon: <Info size={18} />, color: "text-blue-500", bg: "bg-blue-50" };
    }
  };

  if (!currentNoti) return null;

  const style = getStatusStyle(currentNoti.type);

  return (
    <div className="flex items-center gap-4 bg-white rounded-xl px-5 py-3 shadow-sm border border-gray-100 w-full max-w-3xl">
      
      {/* 좌측: 고정된 타이틀 영역 */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="p-2 bg-gray-100 rounded-full text-gray-600">
          <Bell size={16} />
        </div>
        <span className="text-sm font-bold text-gray-700 hidden sm:block">
          시스템 알림
        </span>
      </div>

      {/* 구분선 */}
      <div className="h-8 w-px bg-gray-200 mx-1" />

      {/* 우측: 동적 메시지 영역 (애니메이션 적용) */}
      <div className="flex-1 overflow-hidden flex items-center justify-between">
        <div 
          className={`flex items-center gap-3 transition-all duration-300 transform ${
            isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
          }`}
        >
          {/* 메시지 아이콘 배지 */}
          <span className={`flex items-centerjustify-center p-1 rounded-full ${style.bg} ${style.color}`}>
            {style.icon}
          </span>
          
          {/* 텍스트 내용 */}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-800">
              {currentNoti.message}
            </span>
          </div>
        </div>

        {/* 시간 표시 (우측 끝) */}
        <span className={`text-xs text-gray-400 transition-opacity duration-300 ${isAnimating ? "opacity-0" : "opacity-100"}`}>
          {currentNoti.timestamp}
        </span>
      </div>

    </div>
  );
}