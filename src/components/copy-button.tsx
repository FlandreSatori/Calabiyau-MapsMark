"use client";

import { notify } from "@/components/toast";

type CopyButtonProps = {
    value: string;
    label?: string;
    successMessage?: string;
};

export function CopyButton({ value, label = "复制", successMessage = "已复制到剪贴板。" }: CopyButtonProps) {
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            notify("success", "复制成功", successMessage);
        } catch {
            notify("error", "复制失败", "当前浏览器不支持直接复制，请手动选中后复制。");
        }
    };

    return (
        <button className="button button-primary button-rect copy-button" type="button" onClick={() => void handleCopy()}>
            {label}
        </button>
    );
}