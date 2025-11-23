# Kookmin Dashboard

국민대에 설치된 SmartThings와 Autodesk Tandem을 연동한 조명 제어 대시보드입니다.

## Environment Variables

```bash
# SmartThings API 설정
SMARTTHINGS_BASE_URL=https://api.smartthings.com/v1 # SmartThings API 기본 URL
SMARTTHINGS_PAT=your_smartthings_personal_access_token # SmartThings Personal Access Token

# SmartThings 디바이스 ID
SMARTTHINGS_SENSOR_IDS=device_id_1,device_id_2,device_id_3 # 조도 센서 디바이스 ID 목록 (콤마로 구분)
SMARTTHINGS_LIGHT_IDS=device_id_1,device_id_2,device_id_3 # 조명 디바이스 ID 목록 (콤마로 구분)

# Autodesk Tandem 설정
NEXT_PUBLIC_FACILITY_URN=urn:adsk.dtt:your_facility_urn # Autodesk Tandem Facility URN
NEXT_PUBLIC_APS_TOKEN=your_autodesk_aps_token # [APS Token Generator](https://aps-token-generator.netlify.app)의 3-Legged Flow에서 발급받은 토큰
```

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```
