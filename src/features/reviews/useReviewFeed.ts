import { useInfiniteQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { qk } from '@/api/queryKeys';
import { nextPageOf } from '@/features/me/useMeQueries';

/** Bảng tin bài viết (review đã duyệt) cho lưới Khám phá — cuộn vô hạn. */
export function useReviewFeed() {
    return useInfiniteQuery({
        queryKey: qk.reviews.feed,
        initialPageParam: 0,
        getNextPageParam: nextPageOf,
        queryFn: async ({ pageParam }) => {
            const { data, error } = await api.GET('/api/v1/reviews/feed', {
                params: { query: { page: pageParam, size: 20 } },
            });
            if (error) throw error;
            return data;
        },
    });
}
