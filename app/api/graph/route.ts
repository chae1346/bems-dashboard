import { NextResponse } from "next/server";

const TANDEM_URL = process.env.TANDEM_LUX_HISTORY_URL;
const TANDEM_TOKEN = process.env.TANDEM_API_TOKEN;

export async function GET() {
  if (!TANDEM_URL || !TANDEM_TOKEN) {
    return NextResponse.json(
      { error: "TANDEM_LUX_HISTORY_URL / TANDEM_API_TOKEN이 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const res = await fetch(TANDEM_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${TANDEM_TOKEN}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Tandem history error:", text);
    return NextResponse.json(
      { error: "Tandem 조도 히스토리 호출 실패", detail: text },
      { status: 500 }
    );
  }

  const raw = await res.json();

  // #TODO: 실제 응답 구조에 맞게 변환 필요
  // 예시: raw.items = [{ id, name, values: [lux1, lux2, ...] }, ...] 라고 가정
  const sensors = (raw.items ?? []).map((item: any, idx: number) => ({
    id: item.id ?? `tandem-s${idx + 1}`,
    name: item.name ?? `S${idx + 1}`,
    history: item.values ?? [],
  }));

  return NextResponse.json({ sensors });
}
