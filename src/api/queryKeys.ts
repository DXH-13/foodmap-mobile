/**
 * Khai tập trung toàn bộ query key của TanStack Query.
 *
 * Rải key rời rạc khắp nơi khiến `invalidateQueries` sót chỗ, và dữ liệu cũ đọng lại
 * trên màn hình sau khi người dùng vừa thay đổi thứ gì đó. Khai một chỗ thì luôn
 * nhìn thấy được cây key và invalidate đúng nhánh.
 */
import type { operations } from './generated/schema';

export type PlaceSearchParams = NonNullable<operations['searchPlaces']['parameters']['query']>;

export const qk = {
    places: {
        all: ['places'] as const,
        nearby: (latitude: number, longitude: number, radiusMeters: number, categorySlug?: string) =>
            ['places', 'nearby', latitude, longitude, radiusMeters, categorySlug ?? null] as const,
        /** Mọi tham số tìm kiếm nằm trong key — đổi bộ lọc là một mục cache khác. */
        search: (params: PlaceSearchParams) => ['places', 'search', params] as const,
        detail: (placeId: string) => ['places', 'detail', placeId] as const,
    },

    categories: {
        all: ['categories'] as const,
    },

    reviews: {
        byPlace: (placeId: string) => ['reviews', 'place', placeId] as const,
        feed: ['reviews', 'feed'] as const,
        mine: ['reviews', 'mine'] as const,
        /** Nằm dưới nhánh `mine` để invalidate `mine` cập nhật luôn con số thống kê. */
        mineCount: ['reviews', 'mine', 'count'] as const,
    },

    favorites: {
        all: ['favorites'] as const,
        list: ['favorites', 'list'] as const,
        count: ['favorites', 'count'] as const,
    },

    visits: {
        mine: ['visits', 'mine'] as const,
        mineCount: ['visits', 'mine', 'count'] as const,
    },

    notifications: {
        all: ['notifications'] as const,
    },

    me: {
        profile: ['me', 'profile'] as const,
    },
} as const;
