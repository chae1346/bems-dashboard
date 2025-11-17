"use client";

export function Title() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div 
      onClick={handleRefresh} 
      className="flex flex-col md:flex-row md:items-end gap-3 mb-4 cursor-pointer hover:opacity-70 transition-opacity" 
      title="클릭하면 새로고침 됩니다"
    >
      <h1 className="text-2xl font-bold text-gray-900 leading-none">
        Light Control Dashboard
      </h1>
      <p className="text-sm text-gray-500 pb-0.5">
        실시간 조명 제어 및 모니터링 시스템
      </p>
    </div>
  );
}