import { createApi } from '@reduxjs/toolkit/query/react';
import { apiBaseQuery } from '../../lib/apiClient';
import { CatalogItemDto, mapCatalogItemToBenefit } from './catalogMappers';
import {
  BenefitHighlightsDto,
  BenefitHighlightsResponse,
  mapHighlightResponse,
} from './catalogHighlights';
import { Benefit, CatalogResponse } from './catalogTypes';

interface CatalogListDto {
  items?: CatalogItemDto[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

export interface CatalogQueryArgs {
  categoria?: string;
  municipio?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface CatalogHighlightsQueryArgs {
  since?: string;
  limit?: number;
}

const uniqueValues = (values: Array<string | undefined>): string[] =>
  Array.from(
    new Set(values.filter((value): value is string => typeof value === 'string' && value.length > 0)),
  );

export const catalogApi = createApi({
  reducerPath: 'catalogApi',
  baseQuery: apiBaseQuery,
  tagTypes: ['Catalog'],
  endpoints: (builder) => ({
    getCatalog: builder.query<CatalogResponse, CatalogQueryArgs | void>({
      query: (args) => {
        const searchParams = new URLSearchParams();

        if (args?.categoria) {
          searchParams.set('categoria', args.categoria);
        }

        if (args?.municipio) {
          searchParams.set('municipio', args.municipio);
        }

        if (args?.q) {
          searchParams.set('q', args.q);
        }

        if (args?.page) {
          searchParams.set('page', String(args.page));
        }

        if (args?.pageSize) {
          searchParams.set('pageSize', String(args.pageSize));
        }

        return {
          url: `catalog${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
        };
      },
      transformResponse: (response: CatalogListDto): CatalogResponse => {
        const items = response.items ?? [];
        const benefits = items.map(mapCatalogItemToBenefit);

        const page = response.page ?? 1;
        const totalPages = response.totalPages ?? 1;
        const total = response.total ?? benefits.length;
        const pageSize = response.pageSize;

        const categories = uniqueValues(benefits.map((benefit) => benefit.category));
        const municipalities = uniqueValues(benefits.map((benefit) => benefit.municipality));

        const nextPage = page < totalPages ? page + 1 : null;
        const prevPage = page > 1 ? page - 1 : null;

        return {
          data: benefits,
          meta: {
            page,
            totalPages,
            total,
            pageSize,
            nextPage,
            prevPage,
            filters: {
              categories,
              municipalities,
            },
          },
        };
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map((benefit) => ({ type: 'Catalog' as const, id: benefit.id })),
              { type: 'Catalog' as const, id: 'LIST' },
            ]
          : [{ type: 'Catalog' as const, id: 'LIST' }],
    }),
    getCatalogDetail: builder.query<Benefit, string>({
      query: (id) => ({
        url: `catalog/${id}`,
      }),
      transformResponse: (response: CatalogItemDto): Benefit => mapCatalogItemToBenefit(response),
      providesTags: (_result, _error, id) => [{ type: 'Catalog' as const, id }],
    }),
    getCatalogHighlights: builder.query<BenefitHighlightsResponse, CatalogHighlightsQueryArgs | void>({
      query: (args) => {
        const searchParams = new URLSearchParams();

        if (args?.since) {
          searchParams.set('since', args.since);
        }

        if (args?.limit) {
          searchParams.set('limit', String(args.limit));
        }

        return {
          url: `catalog/highlights${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
        };
      },
      transformResponse: (response: BenefitHighlightsDto) => mapHighlightResponse(response),
      providesTags: () => [{ type: 'Catalog' as const, id: 'HIGHLIGHTS' }],
    }),
  }),
});

export const {
  useGetCatalogQuery,
  useLazyGetCatalogQuery,
  useGetCatalogDetailQuery,
  useLazyGetCatalogHighlightsQuery,
} = catalogApi;
