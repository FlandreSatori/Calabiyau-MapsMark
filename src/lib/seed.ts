import type { AppState } from "@/lib/types";

export const seedState: AppState = {
    maps: [
        {
            id: "demo-1",
            coverImage:
                "data:image/svg+xml;charset=utf-8," +
                encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#7ad8ff" />
                <stop offset="100%" stop-color="#3d5eff" />
              </linearGradient>
            </defs>
            <rect width="1200" height="800" fill="#06111f"/>
            <circle cx="890" cy="180" r="180" fill="url(#g)" opacity="0.32"/>
            <path d="M160 560 L370 340 L545 420 L750 180 L1020 260" stroke="#87e9ff" stroke-width="18" fill="none" opacity="0.82"/>
            <path d="M210 635 C340 560, 450 650, 565 560 S820 420, 980 530" stroke="#ffffff" stroke-width="8" fill="none" opacity="0.28"/>
          </svg>
        `),
            previewImage:
                "data:image/svg+xml;charset=utf-8," +
                encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
            <rect width="1200" height="800" fill="#0b1831"/>
            <rect x="90" y="110" width="1020" height="580" rx="30" fill="#101f3f" stroke="#5abfff" stroke-opacity="0.2"/>
            <circle cx="250" cy="260" r="88" fill="#7ad8ff" opacity="0.24"/>
            <circle cx="560" cy="250" r="88" fill="#a4f4c4" opacity="0.18"/>
            <circle cx="820" cy="250" r="88" fill="#ffc66f" opacity="0.18"/>
            <rect x="220" y="400" width="760" height="36" rx="18" fill="#dce8ff" opacity="0.16"/>
            <rect x="220" y="470" width="560" height="28" rx="14" fill="#dce8ff" opacity="0.12"/>
          </svg>
        `),
            code: "MM-2026-01",
            type: "解密",
            name: "星港回声",
            author: "MapsMark Team",
            mappedAt: "2026-04-18",
            introduction: "示例地图：通过折线航道与隐藏机关串联起一段从海港到核心塔的探索路线。",
            estimatedMinutes: 18,
            submittedAt: "2026-05-28T10:12:00.000Z",
            updatedAt: "2026-05-28T10:12:00.000Z"
        },
        {
            id: "demo-2",
            coverImage:
                "data:image/svg+xml;charset=utf-8," +
                encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
            <rect width="1200" height="800" fill="#06111f"/>
            <path d="M150 610 L260 500 L360 560 L480 330 L610 420 L740 240 L860 290 L1010 170" stroke="#6ef2cc" stroke-width="20" fill="none" opacity="0.8"/>
            <rect x="120" y="120" width="320" height="320" rx="28" fill="#13213d" stroke="#ffffff" stroke-opacity="0.08"/>
            <rect x="520" y="120" width="560" height="120" rx="28" fill="#13213d" stroke="#ffffff" stroke-opacity="0.08"/>
          </svg>
        `),
            previewImage:
                "data:image/svg+xml;charset=utf-8," +
                encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
            <rect width="1200" height="800" fill="#0d1729"/>
            <rect x="100" y="100" width="1000" height="600" rx="32" fill="#111c33" stroke="#7ad8ff" stroke-opacity="0.16"/>
            <path d="M180 520 H1020" stroke="#7ad8ff" stroke-width="10" stroke-opacity="0.3"/>
            <path d="M180 400 H920" stroke="#7ad8ff" stroke-width="10" stroke-opacity="0.2"/>
            <path d="M180 280 H760" stroke="#7ad8ff" stroke-width="10" stroke-opacity="0.15"/>
          </svg>
        `),
            code: "MM-2026-02",
            type: "跑酷",
            name: "跃迁轨道",
            author: "Orbit",
            mappedAt: "2026-05-02",
            introduction: "节奏偏快的跑酷路线，强调连续跃迁、节拍控制与视觉动线。",
            estimatedMinutes: 12,
            submittedAt: "2026-05-29T09:20:00.000Z",
            updatedAt: "2026-05-29T09:20:00.000Z"
        }
    ],
    reviews: [
        {
            id: "review-1",
            mapId: "demo-1",
            reviewerName: "阿澈",
            anonymous: false,
            ratings: {
                entertainment: 5,
                aesthetics: 5,
                guidance: 4,
                difficulty: 3,
                overall: 5
            },
            comment: "节奏和氛围都很稳，线索提示也比较自然。",
            submittedAt: "2026-05-29T12:00:00.000Z",
            updatedAt: "2026-05-29T12:00:00.000Z"
        },
        {
            id: "review-2",
            mapId: "demo-2",
            reviewerName: "匿名",
            anonymous: true,
            ratings: {
                entertainment: 4,
                aesthetics: 4,
                guidance: 4,
                difficulty: 5,
                overall: 4
            },
            comment: "路线很流畅，但操作失误容错低。",
            submittedAt: "2026-05-30T14:18:00.000Z",
            updatedAt: "2026-05-30T14:18:00.000Z"
        }
    ],
    events: [
        {
            id: "event-1",
            kind: "map-create",
            subjectId: "demo-1",
            title: "发布地图 星港回声",
            timestamp: "2026-05-28T10:12:00.000Z"
        },
        {
            id: "event-2",
            kind: "map-create",
            subjectId: "demo-2",
            title: "发布地图 跃迁轨道",
            timestamp: "2026-05-29T09:20:00.000Z"
        },
        {
            id: "event-3",
            kind: "review-create",
            subjectId: "review-1",
            title: "新增评价 星港回声",
            timestamp: "2026-05-29T12:00:00.000Z"
        },
        {
            id: "event-4",
            kind: "review-create",
            subjectId: "review-2",
            title: "新增评价 跃迁轨道",
            timestamp: "2026-05-30T14:18:00.000Z"
        }
    ],
    updatedAt: "2026-05-30T14:18:00.000Z"
};
