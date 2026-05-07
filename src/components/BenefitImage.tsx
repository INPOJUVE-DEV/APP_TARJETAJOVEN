import { ReactNode, useEffect, useMemo, useState } from 'react';

interface BenefitImageProps {
  src?: string;
  alt: string;
  className: string;
  fallback: ReactNode;
}

const GOOGLE_DRIVE_HOSTNAMES = new Set([
  'drive.google.com',
  'www.drive.google.com',
  'docs.google.com',
  'www.docs.google.com',
]);

const normalizeNonEmptyString = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const extractGoogleDriveFileId = (urlValue: string) => {
  try {
    const url = new URL(urlValue);
    if (!GOOGLE_DRIVE_HOSTNAMES.has(url.hostname)) {
      return undefined;
    }

    const fileIdFromQuery = url.searchParams.get('id')?.trim();
    if (fileIdFromQuery) {
      return fileIdFromQuery;
    }

    const match = url.pathname.match(/\/d\/([^/]+)/);
    return match?.[1];
  } catch {
    return undefined;
  }
};

const buildImageSources = (src?: string) => {
  const normalizedSrc = normalizeNonEmptyString(src);
  if (!normalizedSrc) {
    return [];
  }

  const fileId = extractGoogleDriveFileId(normalizedSrc);
  if (!fileId) {
    return [normalizedSrc];
  }

  return [
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`,
    `https://drive.google.com/uc?export=view&id=${fileId}`,
    normalizedSrc,
  ];
};

const BenefitImage = ({ src, alt, className, fallback }: BenefitImageProps) => {
  const sources = useMemo(() => buildImageSources(src), [src]);
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    setSourceIndex(0);
  }, [src]);

  if (sources.length === 0 || sourceIndex >= sources.length) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={sources[sourceIndex]}
      alt={alt}
      className={className}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => {
        setSourceIndex((currentIndex) => currentIndex + 1);
      }}
    />
  );
};

export default BenefitImage;
