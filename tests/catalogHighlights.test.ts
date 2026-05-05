import { describe, expect, it } from 'vitest';
import {
  getBenefitHighlightSince,
  mapHighlightResponse,
  saveBenefitHighlightSeen,
  shouldOpenBenefitHighlight,
} from '../src/features/catalog/catalogHighlights';

const createMemoryStorage = () => {
  const data = new Map<string, string>();

  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
};

describe('catalogHighlights', () => {
  it('normaliza la respuesta del endpoint de beneficios nuevos', () => {
    const response = mapHighlightResponse({
      items: [
        {
          id: 10,
          nombre: 'Cafe Centro',
          categoria: 'Alimentos',
          municipio: 'Tijuana',
          descuento: '20%',
          lat: '32.520000',
          lng: '-117.010000',
          publishedAt: '2026-04-30T15:00:00Z',
          headline: 'Nuevo en tu zona',
          summary: 'Promocion de apertura',
        },
      ],
      generatedAt: '2026-04-30T15:05:00Z',
    });

    expect(response.generatedAt).toBe('2026-04-30T15:05:00Z');
    expect(response.items[0]).toMatchObject({
      publishedAt: '2026-04-30T15:00:00Z',
      headline: 'Nuevo en tu zona',
      summary: 'Promocion de apertura',
    });
    expect(response.items[0].benefit).toMatchObject({
      id: '10',
      name: 'Cafe Centro',
      latitude: 32.52,
      longitude: -117.01,
    });
  });

  it('solo abre el modal cuando el beneficio no ha sido visto', () => {
    const response = mapHighlightResponse({
      items: [
        {
          id: 10,
          nombre: 'Cafe Centro',
          categoria: 'Alimentos',
          municipio: 'Tijuana',
          descuento: '20%',
          publishedAt: '2026-04-30T15:00:00Z',
        },
      ],
    });
    const [highlight] = response.items;
    const localStorageLike = createMemoryStorage();
    const sessionStorageLike = createMemoryStorage();

    expect(shouldOpenBenefitHighlight(highlight, null, null)).toBe(true);

    saveBenefitHighlightSeen(highlight, localStorageLike, sessionStorageLike);

    expect(getBenefitHighlightSince(localStorageLike)).toBe('2026-04-30T15:00:00Z');
    expect(
      shouldOpenBenefitHighlight(
        highlight,
        {
          benefitId: '10',
          publishedAt: '2026-04-30T15:00:00Z',
        },
        {
          benefitId: '10',
          publishedAt: '2026-04-30T15:00:00Z',
        },
      ),
    ).toBe(false);
  });
});
