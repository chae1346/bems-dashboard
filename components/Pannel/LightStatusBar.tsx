"use client";

interface LightInfo {
  id: string;
  label: string;
  brightness: number;
}

interface LightStatusBarProps {
  lights?: LightInfo[];
  onClick?: (light: LightInfo) => void;
}

export default function LightStatusBar({ lights = [], onClick }: LightStatusBarProps) {
  const isFillMode = lights.length > 0 && lights.length <= 3;

  return (
    <div 
      className={`
        w-full gap-2
        ${isFillMode ? "grid" : "flex overflow-x-auto scrollbar-hide"}
      `}
      style={isFillMode ? { gridTemplateColumns: `repeat(${lights.length}, minmax(0, 1fr))` } : {}}
    >
      {lights.map((light) => (
        <button
          key={light.id}
          onClick={() => onClick?.(light)}
          className={`
            flex items-center justify-center gap-2 rounded-md border transition px-3 py-1.5
            text-xs font-medium
            bg-gray-50 hover:bg-gray-100 border-gray-200
            
            ${isFillMode 
              ? "w-full"      
              : "flex-shrink-0"    
            }
          `}
        >
          <span className="text-gray-600">{light.label}</span>
          <span className="text-blue-600 font-bold">{light.brightness}%</span>
        </button>
      ))}
    </div>
  );
}