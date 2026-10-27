import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { qk } from '@/api/queryKeys';

export type NearbyParams = {
    latitude: number;
    longitude: number;
    radiusMeters: number;
    /** Lọc theo một danh mục (chip ở tab Khám phá). */
    categorySlug?: string;
};

/** TP.HCM — điểm gốc khi chưa có vị trí người dùng. */
export const DEFAULT_CENTER = { latitude: 10.7769, longitude: 106.7009 } as const;

/** Bán kính mặc định của MAP-03. */
export const NEARBY_RADIUS_METERS = 2_000;

/**
 * Tìm địa điểm quanh một toạ độ.
 *
 * Backend giới hạn bán kính trong 100–50.000m và trả 400 `RADIUS_OUT_OF_RANGE`
 * nếu vượt — không âm thầm cắt bớt. Client nên kẹp giá trị trước khi gọi.
 */
export function useNearbyPlaces(params: NearbyParams | null) {
    return useQuery({
        queryKey: params
            ? qk.places.nearby(params.latitude, params.longitude, params.radiusMeters, params.categorySlug)
            : qk.places.all,
        enabled: params !== null,
        queryFn: async () => {
            const { data, error } = await api.GET('/api/v1/places/nearby', {
                params: {
                    query: {
                        latitude: params!.latitude,
                        longitude: params!.longitude,
                        radiusMeters: params!.radiusMeters,
                        categorySlugs: params!.categorySlug ? [params!.categorySlug] : undefined,
                        size: 50,
                    },
                },
            });

            if (error) {
                throw error;
            }
            return data;
        },
    });
}
