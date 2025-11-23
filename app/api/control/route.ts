import { NextRequest, NextResponse } from "next/server";

// --- [타입 정의]
interface LightGroupMapEntry { 
    label: string; 
    group: 'wallLeft' | 'wallMiddle' | 'window'; 
}
type LightGroupMappingType = Record<string, LightGroupMapEntry>;

import { LIGHT_GROUP_MAPPING } from "@/app/deviceMap"; 

// --- 환경 변수 설정 ---
const ST_BASE = process.env.SMARTTHINGS_BASE_URL ?? "https://api.smartthings.com/v1";
const ST_PAT = process.env.SMARTTHINGS_PAT;

const LIGHT_IDS = (process.env.SMARTTHINGS_LIGHT_IDS ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

// POST 요청이 들어올 때 실행 (조명 밝기 제어 엔드포인트)
export async function POST(req: NextRequest) {
  console.log("[CONTROL API] 제어 요청 수신");
  console.log(`PAT status: ${ST_PAT ? 'OK' : 'MISSING'}`);
  console.log(`LIGHT_IDS count: ${LIGHT_IDS.length}`);

  if (!ST_PAT || !LIGHT_IDS.length) {
    console.error("[CONTROL API] 환경변수 누락으로 500 응답.");
    return NextResponse.json(
        { error: "SMARTTHINGS_PAT 또는 LIGHT_IDS가 설정되지 않았습니다." },
        { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));
  
  // 1. 프론트엔드에서 계산된 levelW(창가)와 levelR(벽) 값을 읽고 유효성을 검증합니다.
  const levelW = Number(body.levelW); 
  const levelR = Number(body.levelR);

  // 2. 유효성 검증 및 정수화:
  // - levelW || 0: 입력이 유효하지 않은 숫자(NaN)이거나, null/undefined일 경우 안전하게 0으로 처리합니다.
  // - Math.round(): 밝기 레벨은 정수(%) 단위이므로 반올림합니다.
  const finalLevelW = Math.round(levelW || 0);
  const finalLevelR = Math.round(levelR || 0);

  console.log(`[CONTROL API] 최종 밝기 레벨: W=${levelW}%, R=${levelR}%`);

  const headers = {
      Authorization: `Bearer ${ST_PAT}`,
      "Content-Type": "application/json",
  };

  try {
    const mappingData: LightGroupMappingType = LIGHT_GROUP_MAPPING;
    console.log(`[CONTROL API] ${LIGHT_IDS.length}개의 조명을 제어하는 중...`);
      
    const controlPromises = LIGHT_IDS.map((id) => {
        const mapping = mappingData[id];

        let levelToApply: number;
        let groupName: string;
        
        // 3. 그룹에 따라 적용할 밝기 레벨 결정
        if (mapping && mapping.group === 'window') {
            // R (Window) 그룹에는 levelW 적용
            levelToApply = finalLevelW;
            groupName = 'Window (W)';
        } else if (mapping && (mapping.group === 'wallLeft' || mapping.group === 'wallMiddle')) {
            // L (WallLeft) 또는 M (WallMiddle) 그룹에는 levelR 적용
            levelToApply = finalLevelR;
            groupName = 'Wall (R)';
        } else {
            // 맵핑 정보가 없으면 안전을 위해 50% 적용
            levelToApply = 50;
            groupName = 'Unknown';
            console.warn(`[Control API] Light ID: ${id}의 맵핑 정보가 없습니다. 밝기 레벨 50%로 자동 설정합니다.`);
        }
        
        // 4. SmartThings 명령 구조화: setLevel만 포함
        const lightCommands = {
            commands: [
                { component: "main", capability: "switchLevel", command: "setLevel", arguments: [levelToApply] },
            ],
        };

        console.log(`Controlling ${id} (${groupName}): Setting level to ${levelToApply}`);

        // 5. SmartThings API 호출
        return fetch(`${ST_BASE}/devices/${id}/commands`, {
            method: "POST",
            headers,
            body: JSON.stringify(lightCommands),
        });
    });

    // 모든 제어 명령을 병렬로 실행하고 결과를 기다립니다.
    const results = await Promise.all(controlPromises);
    const ok = results.every((r) => r.ok);
    console.log(`[CONTROL API] 밝기 제어가 끝났습니다. ${ok}`);

    // 프론트엔드에 최종 제어 결과를 리턴
    return NextResponse.json({ ok, levelW: finalLevelW, levelR: finalLevelR });
  } catch (err: any) {
    console.error("SmartThings 밝기 제어 실패:", err);
    return NextResponse.json(
        { error: "SmartThings 제어 중 오류", detail: String(err) },
        { status: 500 }
    );
  }
}