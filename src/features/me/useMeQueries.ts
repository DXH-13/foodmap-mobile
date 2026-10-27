import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import type { components } from '@/api/generated/schema';
import { qk } from '@/api/queryKeys';
import { useIsSignedIn } from '@/store/auth';

type PageMeta = components['schemas']['PageMeta'];

const PAGE_SIZE = 20;

/** Trang kế tiếp theo `PageMeta` của API (trang bắt đầu từ 0); hết thì `undefined`. */
export function nextPageOf(last: PageMeta): number | undefined {
    return last.page + 1 < last.totalPages ? last.page + 1 : undefined;
}

/*
 * Các hook dưới đây vẫn gate theo `useIsSignedIn()` dù app đã bắt buộc đăng nhập:
 * lúc đăng xuất / 401 → clearSession, màn tab còn mount thêm một nhịp trước khi bị
 * Redirect — không gate thì chúng bắn request không token và nhận 401 thừa.
 */

/** Hồ sơ người đang đăng nhập (`GET /me`). */
export function useMe() {
    const signedIn = useIsSignedIn();
    return useQuery({
        queryKey: qk.me.profile,
        enabled: signedIn,
        queryFn: async () => {
            const { data, error } = await api.GET('/api/v1/me');
            if (error) throw error;
            return data;
        },
    });
}

/**
 * Hàng thống kê Bài viết · Yêu thích · Đã đến: chỉ cần `totalElements`,
 * nên gọi `size=1` cho nhẹ.
 */
export function useMeCounts() {
    const enabled = useIsSignedIn();
    const reviews = useQuery({
        queryKey: qk.reviews.mineCount,
        enabled,
        queryFn: async () => {
            const { data, error } = await api.GET('/api/v1/me/reviews', { params: { query: { size: 1 } } });
            if (error) throw error;
            return data.totalElements;
        },
    });
    const favorites = useQuery({
        queryKey: qk.favorites.count,
        enabled,
        queryFn: async () => {
            const { data, error } = await api.GET('/api/v1/me/favorites', { params: { query: { size: 1 } } });
            if (error) throw error;
            return data.totalElements;
        },
    });
    const visits = useQuery({
        queryKey: qk.visits.mineCount,
        enabled,
        queryFn: async () => {
            const { data, error } = await api.GET('/api/v1/me/visits', { params: { query: { size: 1 } } });
            if (error) throw error;
            return data.totalElements;
        },
    });
    return { reviews: reviews.data, favorites: favorites.data, visits: visits.data };
}

/** Bài viết của chính mình — mọi trạng thái, kể cả PENDING/REJECTED. */
export function useOwnReviews(active: boolean) {
    const enabled = useIsSignedIn() && active;
    return useInfiniteQuery({
        queryKey: qk.reviews.mine,
        enabled,
        initialPageParam: 0,
        getNextPageParam: nextPageOf,
        queryFn: async ({ pageParam }) => {
            const { data, error } = await api.GET('/api/v1/me/reviews', {
                params: { query: { page: pageParam, size: PAGE_SIZE } },
            });
            if (error) throw error;
            return data;
        },
    });
}

export function useOwnVisits(active: boolean) {
    const enabled = useIsSignedIn() && active;
    return useInfiniteQuery({
        queryKey: qk.visits.mine,
        enabled,
        initialPageParam: 0,
        getNextPageParam: nextPageOf,
        queryFn: async ({ pageParam }) => {
            const { data, error } = await api.GET('/api/v1/me/visits', {
                params: { query: { page: pageParam, size: PAGE_SIZE } },
            });
            if (error) throw error;
            return data;
        },
    });
}

export function useFavorites() {
    return useInfiniteQuery({
        queryKey: qk.favorites.list,
        enabled: useIsSignedIn(),
        initialPageParam: 0,
        getNextPageParam: nextPageOf,
        queryFn: async ({ pageParam }) => {
            const { data, error } = await api.GET('/api/v1/me/favorites', {
                params: { query: { page: pageParam, size: PAGE_SIZE } },
            });
            if (error) throw error;
            return data;
        },
    });
}
