import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { qk, type PlaceSearchParams } from '@/api/queryKeys';

/**
 * Tìm địa điểm theo từ khoá / danh mục / độ phổ biến (`GET /api/v1/places`).
 * `enabled = false` khi chưa có gì để tìm — không gọi API thừa.
 */
export function useSearchPlaces(params: PlaceSearchParams, enabled = true) {
    return useQuery({
        queryKey: qk.places.search(params),
        enabled,
        // Giữ kết quả cũ trong lúc gõ tiếp — danh sách không nháy trắng mỗi phím.
        placeholderData: keepPreviousData,
        queryFn: async () => {
            const { data, error } = await api.GET('/api/v1/places', { params: { query: params } });
            if (error) throw error;
            return data;
        },
    });
}

/** Danh mục món, đã sắp theo `displayOrder`. Ít đổi nên giữ cache lâu. */
export function useCategories() {
    return useQuery({
        queryKey: qk.categories.all,
        staleTime: 30 * 60_000,
        queryFn: async () => {
            const { data, error } = await api.GET('/api/v1/categories');
            if (error) throw error;
            return data;
        },
    });
}
