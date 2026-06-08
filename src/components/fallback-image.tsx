"use client";

import { useEffect, useMemo, useState } from "react";

import { getProxiedGithubUrl } from "@/lib/format";

type FallbackImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
    src?: string;
};

export function FallbackImage({ src, alt, ...rest }: FallbackImageProps) {
    const [hasRetried, setHasRetried] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const fallbackSrc = useMemo(() => getProxiedGithubUrl(src), [src]);
    const shouldUseFallback = Boolean(src && fallbackSrc && fallbackSrc !== src);

    useEffect(() => {
        setHasRetried(false);
        setIsLoaded(false);
    }, [src]);

    useEffect(() => {
        if (!shouldUseFallback || hasRetried || isLoaded) {
            return;
        }

        const timer = setTimeout(() => {
            setHasRetried(true);
        }, 3000);

        return () => {
            clearTimeout(timer);
        };
    }, [hasRetried, isLoaded, shouldUseFallback]);

    const resolvedSrc = hasRetried ? (fallbackSrc ?? src) : src;
    const { onLoad, onError, ...imgProps } = rest;

    return (
        <img
            {...imgProps}
            src={resolvedSrc}
            alt={alt}
            onLoad={(event) => {
                setIsLoaded(true);
                onLoad?.(event);
            }}
            onError={(event) => {
                if (!hasRetried && shouldUseFallback) {
                    setHasRetried(true);
                }
                onError?.(event);
            }}
        />
    );
}
