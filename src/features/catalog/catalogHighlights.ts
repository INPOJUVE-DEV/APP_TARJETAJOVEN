import { mapCatalogItemToBenefit } from './catalogMappers';
import { Benefit } from './catalogTypes';

export interface BenefitHighlightDto {
  id: string | number;
  nombre: string;
  categoria: string;
  municipio: string;
  descuento: string;
  direccion?: string | null;
  horario?: string | null;
  descripcion?: string | null;
  lat?: number | string | null;
  lng?: number | string | null;
  publishedAt: string;
  headline?: string | null;
  summary?: string | null;
  imageUrl?: string | null;
}

export interface BenefitHighlight {
  benefit: Benefit;
  publishedAt: string;
  headline?: string;
  summary?: string;
  imageUrl?: string;
}

export interface BenefitHighlightsResponse {
  items: BenefitHighlight[];
  generatedAt?: string;
}

export interface BenefitHighlightsDto {
  items?: BenefitHighlightDto[];
  generatedAt?: string;
}

export interface StoredHighlightMarker {
  benefitId: string;
  publishedAt: string;
}

const HIGHLIGHT_STORAGE_KEY = 'tj_benefit_highlight_seen';
const HIGHLIGHT_SESSION_KEY = 'tj_benefit_highlight_seen_session';

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const normalizeOptionalString = (value: unknown) => {
  if (!isNonEmptyString(value)) {
    return undefined;
  }

  return value.trim();
};

const parseStoredMarker = (value: string | null): StoredHighlightMarker | null => {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<StoredHighlightMarker>;
    if (!isNonEmptyString(parsed.benefitId) || !isNonEmptyString(parsed.publishedAt)) {
      return null;
    }

    return {
      benefitId: parsed.benefitId,
      publishedAt: parsed.publishedAt,
    };
  } catch {
    return null;
  }
};

export const mapHighlightDtoToBenefitHighlight = (
  item: BenefitHighlightDto,
): BenefitHighlight => ({
  benefit: mapCatalogItemToBenefit(item),
  publishedAt: item.publishedAt,
  headline: normalizeOptionalString(item.headline),
  summary: normalizeOptionalString(item.summary),
  imageUrl: normalizeOptionalString(item.imageUrl),
});

export const mapHighlightResponse = (
  response: BenefitHighlightsDto,
): BenefitHighlightsResponse => ({
  items: (response.items ?? []).map(mapHighlightDtoToBenefitHighlight),
  generatedAt: normalizeOptionalString(response.generatedAt),
});

export const getHighlightMarker = (
  highlight: Pick<BenefitHighlight, 'benefit' | 'publishedAt'>,
): StoredHighlightMarker => ({
  benefitId: highlight.benefit.id,
  publishedAt: highlight.publishedAt,
});

export const isSameHighlightMarker = (
  left: StoredHighlightMarker | null,
  right: StoredHighlightMarker | null,
) =>
  Boolean(
    left &&
      right &&
      left.benefitId === right.benefitId &&
      left.publishedAt === right.publishedAt,
  );

export const shouldOpenBenefitHighlight = (
  highlight: BenefitHighlight | null | undefined,
  persistedMarker: StoredHighlightMarker | null,
  sessionMarker: StoredHighlightMarker | null,
) => {
  if (!highlight) {
    return false;
  }

  const nextMarker = getHighlightMarker(highlight);
  return !isSameHighlightMarker(nextMarker, persistedMarker) && !isSameHighlightMarker(nextMarker, sessionMarker);
};

export const loadHighlightMarker = (storage?: StorageLike | null) => {
  if (!storage) {
    return null;
  }

  return parseStoredMarker(storage.getItem(HIGHLIGHT_STORAGE_KEY));
};

export const loadSessionHighlightMarker = (storage?: StorageLike | null) => {
  if (!storage) {
    return null;
  }

  return parseStoredMarker(storage.getItem(HIGHLIGHT_SESSION_KEY));
};

export const saveBenefitHighlightSeen = (
  highlight: BenefitHighlight,
  localStorageLike?: StorageLike | null,
  sessionStorageLike?: StorageLike | null,
) => {
  const marker = JSON.stringify(getHighlightMarker(highlight));

  localStorageLike?.setItem(HIGHLIGHT_STORAGE_KEY, marker);
  sessionStorageLike?.setItem(HIGHLIGHT_SESSION_KEY, marker);
};

export const getBenefitHighlightSince = (storage?: StorageLike | null) =>
  loadHighlightMarker(storage)?.publishedAt;
