import { Benefit } from './catalogTypes';

export interface CatalogItemDto {
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
}

export const mapCatalogItemToBenefit = (item: CatalogItemDto): Benefit => ({
  id: String(item.id),
  name: item.nombre,
  category: item.categoria,
  municipality: item.municipio,
  discount: item.descuento,
  address: item.direccion ?? undefined,
  schedule: item.horario ?? undefined,
  description: item.descripcion ?? undefined,
  latitude:
    typeof item.lat === 'number'
      ? item.lat
      : typeof item.lat === 'string' && item.lat.trim().length > 0
      ? Number(item.lat)
      : undefined,
  longitude:
    typeof item.lng === 'number'
      ? item.lng
      : typeof item.lng === 'string' && item.lng.trim().length > 0
      ? Number(item.lng)
      : undefined,
});
