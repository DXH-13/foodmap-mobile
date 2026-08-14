import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { qk } from '@/api/queryKeys';

export type NearbyParams = {
    latitude: number;
    longitude: number;
    radiusMeters: number;
};

/**
 * Tìm địa điểm quanh một toạ độ.
 *
 * Backend giới hạn bán kính trong 100–50.000m và trả 400 `RADIUS_OUT_OF_RANGE`
 * nếu vượt — không âm thầm cắt bớt. Client nên kẹp giá trị trước khi gọi.
 */
export function useNearbyPlaces(params: NearbyParams | null) {
    return useQuery({
        queryKey: params
            ? qk.places.nearby(params.latitude, params.longitude, params.radiusMeters)
            : qk.places.all,
        enabled: params !== null,
        queryFn: async () => {
            const { data, error } = await api.GET('/api/v1/places/nearby', {
                params: {
                    query: {
                        latitude: params!.latitude,
                        longitude: params!.longitude,
                        radiusMeters: params!.radiusMeters,
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
