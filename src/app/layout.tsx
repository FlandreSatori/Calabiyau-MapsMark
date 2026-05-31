import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
    title: "MapsMark",
    description: "地图投稿、评价与雷达图展示平台"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="zh-CN">
            <body>{children}</body>
        </html>
    );
}
