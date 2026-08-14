/**
 * Khai tập trung toàn bộ query key của TanStack Query.
 *
 * Rải key rời rạc khắp nơi khiến `invalidateQueries` sót chỗ, và dữ liệu cũ đọng lại
 * trên màn hình sau khi người dùng vừa thay đổi thứ gì đó. Khai một chỗ thì luôn
 * nhìn thấy được cây key và invalidate đúng nhánh.
 */
export const qk = {
    places: {
        all: ['places'] as const,
        nearby: (latitude: number, longitude: number, radiusMeters: number) =>
            ['places', 'nearby', latitude, longitude, radiusMeters] as const,
        search: (query: string) => ['places', 'search', query] as const,
        detail: (placeId: string) => ['places', 'detail', placeId] as const,
    },

    categories: {
        all: ['categories'] as const,
    },

    reviews: {
        byPlace: (placeId: string) => ['reviews', 'place', placeId] as const,
        mine: ['reviews', 'mine'] as const,
    },

    favorites: {
        all: ['favorites'] as const,
    },

    visits: {
        mine: ['visits', 'mine'] as const,
    },

    notifications: {
        all: ['notifications'] as const,
    },

    me: {
        profile: ['me', 'profile'] as const,
    },
} as const;
