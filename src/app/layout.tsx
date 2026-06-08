import type { Metadata } from "next";

import "./globals.css";
import { BackToTopButton } from "@/components/back-to-top";
import { SiteTopBar } from "@/components/site-top-bar";
import Toasts from "@/components/toast";

export const metadata: Metadata = {
    title: "MapsMark",
    description: "喵拉喵丘喵了喵"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="zh-CN" suppressHydrationWarning>
            <body suppressHydrationWarning>
                <SiteTopBar />
                {children}
                <BackToTopButton />
                <Toasts />
            </body>
        </html>
    );
}
