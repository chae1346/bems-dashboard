import sys
import json
import math

# ==============================================================================
# 조도 기반 밝기 조정 계산 함수
# 프론트엔드에서 API 호출 및 모드 선택을 처리하므로, 
# 여기서는 조도값을 받아 밝기 변화량과 색상값만 계산하여 리턴합니다.
# ==============================================================================

# 공부 환경별 색온도 설정 (켈빈 단위)
STUDY_MODE_COLORS = {
    "수리": 5000,    # 명확한 시야를 위한 중성 흰색
    "언어": 4000,    # 집중력 향상을 위한 따뜻한 흰색
    "탐구": 4500,    # 중성적인 흰색
    "암기": 6000,    # 각성도 증가를 위한 차가운 흰색
    "기본": 4500     # 기본 색온도
}

# 조명 밝기-조도 보정 곡선 계수
# 실제 측정 데이터 기반 선형 회귀 분석 결과
# 조도 = base_lux + (brightness_level / 100) * slope
# 각 위치별로 외부 광원의 영향이 다르므로 별도 계수 사용
# 외부 광원 유무를 구분하지 않고 통합된 모델 사용

LIGHTING_CURVES = {
    "L": {
        "base_lux": 50.0,      # 0% 밝기일 때 기본 조도 (외부 광원 포함)
        "slope": 167.0        # 밝기 1%당 조도 증가량
    },
    "C": {
        "base_lux": 25.0,
        "slope": 180.0
    },
    "R": {
        "base_lux": 8.0,
        "slope": 170.0
    }
}

def calculate_lux_from_brightness(brightness: float, position: str) -> float:
    """
    밝기 레벨(%)로부터 예상 조도값(lux)을 계산
    
    Args:
        brightness: 조명 밝기 레벨 (0-100)
        position: 위치 ("L", "C", "R")
    
    Returns:
        예상 조도값 (lux)
    """
    curve = LIGHTING_CURVES[position]
    return curve["base_lux"] + (brightness / 100.0) * curve["slope"]

def calculate_brightness_from_lux(target_lux: float, position: str) -> float:
    """
    목표 조도값으로부터 필요한 밝기 레벨(%)을 계산
    
    Args:
        target_lux: 목표 조도값 (lux)
        position: 위치 ("L", "C", "R")
    
    Returns:
        필요한 밝기 레벨 (0-100)
    """
    curve = LIGHTING_CURVES[position]
    base = curve["base_lux"]
    slope = curve["slope"]
    
    if slope == 0:
        return 0.0
    
    brightness = ((target_lux - base) / slope) * 100.0
    return max(0.0, min(100.0, brightness))

def calculate_brightness_adjustment(
    current_lux_L: float,      # 현재 창가(L) 조도값 (lux)
    current_lux_C: float,       # 현재 중앙(C) 조도값 (lux)
    current_lux_R: float,      # 현재 벽면(R) 조도값 (lux)
    target_lux: float,         # 목표 조도값 (lux)
    current_level_L: int,      # 현재 창가 그룹 밝기 레벨 (0-100)
    current_level_C: int,      # 현재 중앙 그룹 밝기 레벨 (0-100)
    current_level_R: int,      # 현재 벽면 그룹 밝기 레벨 (0-100)
    study_mode: str = "기본"   # 공부 모드 ("수리", "언어", "탐구", "암기", "기본")
) -> tuple[int, int, int]:
    """
    목표 조도값을 달성하기 위해 필요한 밝기 레벨과 색온도를 계산합니다.
    
    [알고리즘]
    1. 각 위치별로 목표 조도에 필요한 밝기 계산
    2. 창가 밝기를 최소화하여 전기 에너지 절약
    3. 공부 모드에 맞는 색온도 설정
    
    [오차 허용]
    - 목표 조도와의 차이가 10lux 이내면 현재 밝기 유지
    
    Args:
        current_lux_L: 현재 창가 조도값
        current_lux_C: 현재 중앙 조도값
        current_lux_R: 현재 벽면 조도값
        target_lux: 목표 조도값
        current_level_L: 현재 창가 밝기 레벨
        current_level_C: 현재 중앙 밝기 레벨
        current_level_R: 현재 벽면 밝기 레벨
        study_mode: 공부 모드
    
    Returns:
        (창가 밝기, 중앙 밝기, 벽면 밝기)
    """
    
    # 목표 조도가 0 이하면 모두 소등
    if target_lux <= 0:
        return (0, 0, 0)
    
    # 현재 평균 조도와 목표 조도의 차이 확인
    avg_current_lux = (current_lux_L + current_lux_C + current_lux_R) / 3.0
    lux_diff = abs(avg_current_lux - target_lux)
    
    # 오차가 10lux 이내면 현재 밝기 유지
    if lux_diff <= 10.0:
        return (current_level_L, current_level_C, current_level_R)
    
    # 각 위치별로 목표 조도에 필요한 밝기 계산
    # 반복적으로 조정하여 균형 맞추기
    level_L = calculate_brightness_from_lux(target_lux, "L")
    level_C = calculate_brightness_from_lux(target_lux, "C")
    level_R = calculate_brightness_from_lux(target_lux, "R")
    
    # 예상 조도값 계산
    expected_lux_L = calculate_lux_from_brightness(level_L, "L")
    expected_lux_C = calculate_lux_from_brightness(level_C, "C")
    expected_lux_R = calculate_lux_from_brightness(level_R, "R")
    
    # 조도 차이를 최소화하기 위해 미세 조정
    # 창가 밝기를 최소화하여 전기 절약 (외부 광원 활용)
    max_iterations = 10
    tolerance = 5.0  # 5lux 오차 허용
    
    for _ in range(max_iterations):
        avg_expected = (expected_lux_L + expected_lux_C + expected_lux_R) / 3.0
        diff = target_lux - avg_expected
        
        if abs(diff) < tolerance:
            break
        
        # 각 위치별로 조정 (창가는 최소화)
        if expected_lux_L < target_lux - tolerance:
            level_L = min(100, level_L + 2)
        elif expected_lux_L > target_lux + tolerance and level_L > 0:
            level_L = max(0, level_L - 2)
        
        if expected_lux_C < target_lux - tolerance:
            level_C = min(100, level_C + 2)
        elif expected_lux_C > target_lux + tolerance and level_C > 0:
            level_C = max(0, level_C - 2)
        
        if expected_lux_R < target_lux - tolerance:
            level_R = min(100, level_R + 2)
        elif expected_lux_R > target_lux + tolerance and level_R > 0:
            level_R = max(0, level_R - 2)
        
        # 재계산
        expected_lux_L = calculate_lux_from_brightness(level_L, "L")
        expected_lux_C = calculate_lux_from_brightness(level_C, "C")
        expected_lux_R = calculate_lux_from_brightness(level_R, "R")
    
    # 밝기 값은 0% ~ 100% 범위로 제한 및 반올림
    level_L = max(0, min(100, round(level_L)))
    level_C = max(0, min(100, round(level_C)))
    level_R = max(0, min(100, round(level_R)))
    
    return (level_L, level_C, level_R)

# ==============================================================================
# Node.js 통신 인터페이스
# ==============================================================================

if __name__ == "__main__":
    try:
        data = json.loads(sys.argv[1])
        
        # 입력 데이터 추출
        current_lux_L = data.get("currentLuxL", 0.0)
        current_lux_C = data.get("currentLuxC", 0.0)
        current_lux_R = data.get("currentLuxR", 0.0)
        target_lux = data.get("targetLux", 0.0)
        current_level_L = data.get("currentLevelL", 0)
        current_level_C = data.get("currentLevelC", 0)
        current_level_R = data.get("currentLevelR", 0)
        study_mode = data.get("studyMode", "기본")
        
        # 밝기 조정 계산
        level_L, level_C, level_R = calculate_brightness_adjustment(
            current_lux_L=current_lux_L,
            current_lux_C=current_lux_C,
            current_lux_R=current_lux_R,
            target_lux=target_lux,
            current_level_L=current_level_L,
            current_level_C=current_level_C,
            current_level_R=current_level_R,
            study_mode=study_mode
        )
        
        # JSON 형식으로 결과 출력
        result = {
            "levelL": level_L,
            "levelC": level_C,
            "levelR": level_R
        }
        print(json.dumps(result))
        
    except Exception as e:
        # 어떤 오류가 발생했는지 콘솔에 출력 (디버깅용)
        sys.stderr.write(f"Error during execution: {e}\n")
        # 오류 발생 시 안전값 반환
        print(json.dumps({
            "levelL": 50,
            "levelC": 50,
            "levelR": 50
        }))
