import { NextRequest, NextResponse } from "next/server";

const ST_BASE = process.env.SMARTTHINGS_BASE_URL ?? "https://api.smartthings.com/v1";
const ST_PAT = process.env.SMARTTHINGS_PAT;

const LIGHT_IDS = (process.env.SMARTTHINGS_LIGHT_IDS ?? "")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);

// POST /api/control 요청이 들어올 때 실행
export async function POST(req: NextRequest) {
  if (!ST_PAT || !LIGHT_IDS.length) {
    return NextResponse.json(
      { error: "SMARTTHINGS_PAT / SMARTTHINGS_LIGHT_IDS가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));
  let level = Number(body.brightness);

  if (!Number.isFinite(level)) level = 0;
  if (level < 0) level = 0;
  if (level > 100) level = 100;

  const headers = {
    Authorization: `Bearer ${ST_PAT}`,
    "Content-Type": "application/json",
  };

  const commandBody = {
    commands: [
      {
        component: "main",
        capability: "switchLevel",
        command: "setLevel",
        arguments: [level],
      },
    ],
  };

  try {
    const results = await Promise.all(
      LIGHT_IDS.map((id) =>
        fetch(`${ST_BASE}/devices/${id}/commands`, {
          method: "POST",
          headers,
          body: JSON.stringify(commandBody),
        })
      )
    );

    const ok = results.every((r) => r.ok);

    // 프론트에는 제어 결과와 최종 밝기값만 리턴
    return NextResponse.json({ ok, brightness: level });
  } catch (err: any) {
    console.error("SmartThings 밝기 제어 실패:", err);
    return NextResponse.json(
      { error: "SmartThings 제어 중 오류", detail: String(err) },
      { status: 500 }
    );
  }
}
