import { NextResponse } from "next/server";

const ST_BASE = process.env.SMARTTHINGS_BASE_URL ?? "https://api.smartthings.com/v1";
const ST_PAT = process.env.SMARTTHINGS_PAT;

const SENSOR_IDS = (process.env.SMARTTHINGS_SENSOR_IDS ?? "")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);

const LIGHT_IDS = (process.env.SMARTTHINGS_LIGHT_IDS ?? "")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);

async function fetchStatus(id: string, headers: Record<string, string>) {
  const res = await fetch(`${ST_BASE}/devices/${id}/status`, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("SmartThings status error:", id, text);
    return null;
  }

  // SmartThings에서 내려준 JSON 그대로 리턴
  return res.json();
}

export async function GET() {
  if (!ST_PAT) {
    return NextResponse.json(
      { error: "SMARTTHINGS_PAT 환경변수가 없습니다." },
      { status: 500 }
    );
  }

  if (!SENSOR_IDS.length && !LIGHT_IDS.length) {
    return NextResponse.json(
      { error: "SMARTTHINGS_SENSOR_IDS / SMARTTHINGS_LIGHT_IDS가 비어있습니다." },
      { status: 500 }
    );
  }

  const headers = {
    Authorization: `Bearer ${ST_PAT}`,
    "Content-Type": "application/json",
  };

  // 조도 센서 상태
  const sensorStatuses = await Promise.all(
    SENSOR_IDS.map((id) => fetchStatus(id, headers))
  );

  // 전구 상태
  const lightStatuses = await Promise.all(
    LIGHT_IDS.map((id) => fetchStatus(id, headers))
  );

  const sensors = sensorStatuses.map((json, idx) => {
    if (!json) {
      return {
        id: SENSOR_IDS[idx],
        name: `S${idx + 1}`,
        lux: 0,
      };
    }
    // SmartThings status 구조에서 illuminance 값 꺼내기
    const lux =
      json.components?.main?.illuminanceMeasurement?.illuminance?.value ??
      0;

    return {
      id: SENSOR_IDS[idx],
      name: `S${idx + 1}`,
      lux: Number(lux) || 0,
    };
  });

  const lights = lightStatuses.map((json, idx) => {
    if (!json) {
      return {
        id: LIGHT_IDS[idx],
        name: `L${idx + 1}`,
        brightness: 0,
      };
    }
    // SmartThings status 구조에서 밝기(level) 꺼내기
    const level =
      json.components?.main?.switchLevel?.level?.value ?? 0;

    return {
      id: LIGHT_IDS[idx],
      name: `L${idx + 1}`,
      brightness: Number(level) || 0,
    };
  });

  return NextResponse.json({ sensors, lights });
}
