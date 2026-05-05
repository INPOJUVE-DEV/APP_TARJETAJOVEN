export interface Benefit {
  id: string;
  name: string;
  category: string;
  municipality: string;
  discount: string;
  address?: string;
  schedule?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
}

export interface CatalogMeta {
  page: number;
  totalPages: number;
  total: number;
  pageSize?: number;
  nextPage?: number | null;
  prevPage?: number | null;
  filters?: {
    categories?: string[];
    municipalities?: string[];
  };
}

export interface CatalogResponse {
  data: Benefit[];
  meta: CatalogMeta;
}
