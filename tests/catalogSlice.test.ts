import { describe, expect, it } from 'vitest';
import { mapCatalogItemToBenefit } from '../src/features/catalog/catalogMappers';

describe('catalogSlice', () => {
  it('normaliza coordenadas string del backend', () => {
    const benefit = mapCatalogItemToBenefit({
      id: 15,
      nombre: 'Cafe Centro',
      categoria: 'Restaurantes',
      municipio: 'Tijuana',
      descuento: '20%',
      lat: '32.52151000',
      lng: '-117.02454000',
    });

    expect(benefit).toMatchObject({
      id: '15',
      latitude: 32.52151,
      longitude: -117.02454,
    });
  });

  it('mantiene coordenadas undefined cuando el backend no las manda', () => {
    const benefit = mapCatalogItemToBenefit({
      id: '16',
      nombre: 'Sin mapa',
      categoria: 'Servicios',
      municipio: 'Mexicali',
      descuento: '10%',
      lat: null,
      lng: null,
    });

    expect(benefit.latitude).toBeUndefined();
    expect(benefit.longitude).toBeUndefined();
  });
});
