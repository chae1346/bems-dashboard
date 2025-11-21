
// 조명
export const LIGHT_GROUP_MAPPING: Record<
  string, 
  { label: string, group: 'Left' | 'Middle' | 'Right' }
> = {
    "bbb4a6eb-b4b6-422f-b7b1-0572d11e10cb": { label: "L1", group: "Left" },
    "a00534d8-171c-465c-ad12-6e92ac89b97e": { label: "L2", group: "Left" },
    "56267746-a95f-4d4e-a693-7e32b9f51cce": { label: "L3", group: "Left" },
    "edbc189a-d6fd-414f-ab14-bad80fab335f": { label: "M1", group: "Middle" },
    "a6cd9cc6-02c6-4a56-adf4-7c51bcaab3b7": { label: "M2", group: "Middle" },
    "3352c48c-d628-4fe0-a518-b82205fa70a0": { label: "M3", group: "Middle" },
    "43de080b-4a99-4b1d-96c1-161df5471dbf": { label: "R1", group: "Right" },
    "aee8ebc9-9f3a-4a08-aedd-ff78d88a7b0d": { label: "R2", group: "Right" },
    "R3_ID_YZA": { label: "R3", group: "Right" },
};

// 센서
export const SENSOR_DISPLAY_MAP: Record<
  string, 
  { name: string, color: string }
> = {
    "afc898c9-94b4-499d-a479-014ffb9eab91": { name: "S1", color: "#ef4444" },
    "S2_ID_RTY": { name: "S2", color: "#f97316" },
    "S3_ID_UOP": { name: "S3", color: "#eab308" },
    "S4_ID_ASD": { name: "S4", color: "#22c55e" },
    "S5_ID_FGH": { name: "S5", color: "#3b82f6" },
};