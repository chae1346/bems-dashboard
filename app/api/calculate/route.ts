import { NextRequest, NextResponse } from "next/server";
import { spawn } from 'child_process'; // ⭐️ exec 대신 spawn 임포트
// import { exec } from 'child_process'; // exec, promisify 더 이상 사용하지 않음
// import { promisify } from 'util'; 

// const execPromise = promisify(exec); // 더 이상 사용하지 않음
const PYTHON_SCRIPT_PATH = 'calculator.py'; 

export async function POST(req: NextRequest) {
    let targetLux: number;

    try {
        const body = await req.json();
        // page.tsx에서 보낸 targetLux 값을 읽습니다.
        targetLux = Number(body.targetLux); 
        
        if (isNaN(targetLux) || targetLux < 0) {
             return NextResponse.json({ error: "Invalid targetLux value" }, { status: 400 });
        }

    } catch (error) {
        return NextResponse.json({ error: "Invalid JSON input" }, { status: 400 });
    }

    // ⭐️ [수정] 2. spawn을 사용한 실행 로직
    try {
        // 1. Lux 값을 JSON 문자열로 변환하여 파이썬 스크립트에 인수로 전달
        const jsonInput = JSON.stringify({ targetLux });
        
        // 2. spawn을 사용하여 쉘을 거치지 않고 직접 실행
        const pythonProcess = spawn('python3', [PYTHON_SCRIPT_PATH, jsonInput]);
        
        let stdoutData = '';
        let stderrData = '';

        // stdout/stderr 데이터 수집
        pythonProcess.stdout.on('data', (data) => {
            stdoutData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            stderrData += data.toString();
        });

        // 3. 프로세스 종료를 기다리고 오류 확인
        await new Promise<void>((resolve, reject) => {
            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    console.error(`❌ Python Process Failed. Code: ${code}. Stderr: ${stderrData}`);
                    return reject(new Error(`Python script failed with code ${code}.`));
                }
                resolve();
            });
            pythonProcess.on('error', (err) => {
                reject(new Error(`Failed to start python process: ${err.message}`));
            });
        });
        
        if (stderrData) { // Python 스크립트에서 디버깅 메시지나 경고를 출력했을 경우
            console.warn(`Python Stderr (Warning/Debug): ${stderrData}`);
        }

        // 4. 파이썬이 표준 출력(stdout)으로 내보낸 JSON 결과를 파싱
        if (!stdoutData.trim()) {
            throw new Error("Python script returned empty output.");
        }
        
        const result = JSON.parse(stdoutData); 

        // 5. 계산된 levelW, levelR 값을 프론트엔드에 반환
        return NextResponse.json({ 
            levelL: result.levelL, 
            levelC: result.levelC,
            levelR: result.levelR 
        });

    } catch (error: any) {
        // 파이썬 실행 자체에서 오류가 발생한 경우 (예: 파일 경로 오류, 파이썬 구문 오류, JSON 파싱 오류)
        console.error("❌ Algorithm calculation failed:", error.message);
        
        return NextResponse.json(
            { error: "Algorithm calculation failed", detail: error.message },
            { status: 500 }
        );
    }
}