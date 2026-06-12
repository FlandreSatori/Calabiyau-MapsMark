"use client";

import { useMemo } from "react";

import { resolveMapImageUrl } from "@/lib/format";

type FallbackImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
    src?: string;
};

export function FallbackImage({ src, alt, ...rest }: FallbackImageProps) {
    const resolvedSrc = useMemo(() => resolveMapImageUrl(src), [src]);

    return (
        <img
            {...rest}
            src={resolvedSrc}
            alt={alt}
        />
    );
}
