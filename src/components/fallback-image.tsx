"use client";

import { useEffect, useMemo, useState } from "react";

import { getProxiedGithubUrl } from "@/lib/format";

type FallbackImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
    src?: string;
    customSrc?: string;
};

export function FallbackImage({ src, customSrc, alt, ...rest }: FallbackImageProps) {
    const effectiveSrc = customSrc && customSrc.trim() ? customSrc : src;
    const useCustom = Boolean(customSrc && customSrc.trim());

    const [hasRetried, setHasRetried] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const fallbackSrc = useMemo(() => (useCustom ? undefined : getProxiedGithubUrl(effectiveSrc)), [effectiveSrc, useCustom]);
    const shouldUseFallback = !useCustom && Boolean(effectiveSrc && fallbackSrc && fallbackSrc !== effectiveSrc);

    useEffect(() => {
        setHasRetried(false);
        setIsLoaded(false);
    }, [effectiveSrc]);

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

    const resolvedSrc = useCustom ? effectiveSrc : (hasRetried ? (fallbackSrc ?? effectiveSrc) : effectiveSrc);
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
