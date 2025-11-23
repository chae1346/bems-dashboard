
// 조명
export const LIGHT_GROUP_MAPPING: Record<
  string, 
  { label: string, group: 'left' | 'middle' | 'right' }
> = {
    "bbb4a6eb-b4b6-422f-b7b1-0572d11e10cb": { label: "L1", group: "left" },
    "a00534d8-171c-465c-ad12-6e92ac89b97e": { label: "L2", group: "left" },
    "56267746-a95f-4d4e-a693-7e32b9f51cce": { label: "L3", group: "left" },
    "edbc189a-d6fd-414f-ab14-bad80fab335f": { label: "M1", group: "middle" },
    "a6cd9cc6-02c6-4a56-adf4-7c51bcaab3b7": { label: "M2", group: "middle" },
    "3352c48c-d628-4fe0-a518-b82205fa70a0": { label: "M3", group: "middle" },
    "43de080b-4a99-4b1d-96c1-161df5471dbf": { label: "R1", group: "right" },
    "aee8ebc9-9f3a-4a08-aedd-ff78d88a7b0d": { label: "R2", group: "right" },
    "2615c395-9292-449c-b4b5-f8c6d2a4a55e": { label: "R3", group: "right" },
};

// 센서
export const SENSOR_DISPLAY_MAP: Record<
  string, 
  { name: string, color: string }
> = {
    "86e62399-04e4-4b13-9224-1ea93fb77e5d": { name: "S1", color: "#ef4444" },
    "a7a0613b-a65c-49b4-a185-84e1845a5609": { name: "S2", color: "#f97316" },
    "afc898c9-94b4-499d-a479-014ffb9eab91": { name: "S3", color: "#eab308" }
};