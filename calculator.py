import sys
import json
import math

# 1. 보정 곡선 기반 밝기 계산 로직 상수
FACTOR_BASE_M = 1.285714
FACTOR_BASE_B = 1.42857
FACTOR_DELTA_M = 0.285714
FACTOR_DELTA_B = 11.42857

def calculate_compensated_levels(target_lux_Y: float) -> tuple[int, int]:
    """
    목표 조도(Y)를 달성하기 위해 보정 곡선 모델을 적용하여 
    창가(W)와 벽쪽(R)의 밝기 수준(%)을 계산합니다.
    """
    if target_lux_Y <= 0:
        return 0, 0 

    # 1. X_base (평균 밝기) 계산
    X_base = FACTOR_BASE_M * target_lux_Y + FACTOR_BASE_B

    # 2. Delta_X (필요 밝기 차이) 계산
    Delta_X = FACTOR_DELTA_M * target_lux_Y + FACTOR_DELTA_B

    # 3. 최종 밝기 설정
    level_window = X_base - (Delta_X / 2.0)
    level_wall = X_base + (Delta_X / 2.0)

    # 4. 밝기 값은 반드시 0% ~ 100% 범위로 제한
    level_window = max(0, min(100, round(level_window)))
    level_wall = max(0, min(100, round(level_wall)))
    
    return level_window, level_wall

# 2. Node.js 통신 인터페이스
if __name__ == "__main__":
    try:
        data = json.loads(sys.argv[1])
        target_lux = data.get("targetLux", 0) 
        
        level_W, level_R = calculate_compensated_levels(target_lux)
        
        print(json.dumps({"levelW": level_W, "levelR": level_R}))
        
    except Exception as e:
        # 어떤 오류가 발생했는지 콘솔에 출력 (디버깅용)
        import sys
        sys.stderr.write(f"Error during execution: {e}\n")
        # 오류 발생 시 안전값 반환
        print(json.dumps({"levelW": 50, "levelR": 50}))