"use client";

import { useMemo, useState } from "react";

import { getProxiedGithubUrl } from "@/lib/format";

type FallbackImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
    src?: string;
};

export function FallbackImage({ src, alt, ...rest }: FallbackImageProps) {
    const [hasRetried, setHasRetried] = useState(false);

    const fallbackSrc = useMemo(() => getProxiedGithubUrl(src), [src]);

    return (
        <img
            {...rest}
            src={hasRetried ? fallbackSrc : src}
            alt={alt}
            onError={() => {
                if (!hasRetried && fallbackSrc && fallbackSrc !== src) {
                    setHasRetried(true);
                }
            }}
        />
    );
}
