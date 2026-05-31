import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
    title: "MapsMark",
    description: "喵拉喵丘喵了喵"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="zh-CN">
            <body>{children}</body>
        </html>
    );
}
