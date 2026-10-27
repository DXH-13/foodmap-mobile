import { FlashList } from '@shopify/flash-list';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { components } from '@/api/generated/schema';
import { Chip } from '@/components/chip';
import { useTabBarInset } from '@/components/glass-tab-bar';
import { LargeTitle, StatusBarScrim } from '@/components/large-title';
import { PlaceCard } from '@/components/place-card';
import { PostCard } from '@/components/post-card';
import { SectionHeader } from '@/components/section-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/state-view';
import { Palette, Space, Type } from '@/constants/theme';
import { DEFAULT_CENTER, NEARBY_RADIUS_METERS, useNearbyPlaces } from '@/features/places/useNearbyPlaces';
import { useCategories, useSearchPlaces } from '@/features/places/useSearchPlaces';
import { useReviewFeed } from '@/features/reviews/useReviewFeed';

type PlaceSummary = components['schemas']['PlaceSummary'];

/** Khoảng hở giữa hai cột lưới bài viết. */
const GRID_GAP = 10;

/**
 * Vị trí người dùng nếu ĐÃ cho phép từ trước (tab Bản đồ xin quyền) — tab này không tự
 * bật hộp thoại xin quyền. Chưa có thì dùng TP.HCM.
 */
function useKnownLocation() {
    const [coords, setCoords] = useState<{ latitude: number; longitude: number }>(DEFAULT_CENTER);
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const { granted } = await Location.getForegroundPermissionsAsync();
            if (!granted) return;
            const last = await Location.getLastKnownPositionAsync();
            if (!cancelled && last) {
                setCoords({ latitude: last.coords.latitude, longitude: last.coords.longitude });
            }
        })().catch(() => {});
        return () => {
            cancelled = true;
        };
    }, []);
    return coords;
}

/**
 * Khám phá: danh mục, quán gần, quán phổ biến, rồi lưới bài viết 2 cột (kiểu Lemon8).
 * Cả trang là MỘT FlashList masonry; các mục phía trên nằm trong header của nó.
 */
export default function ExploreScreen() {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const tabBarInset = useTabBarInset();
    const [category, setCategory] = useState<string | undefined>(undefined);

    const coords = useKnownLocation();
    const categories = useCategories();
    const nearby = useNearbyPlaces({ ...coords, radiusMeters: NEARBY_RADIUS_METERS, categorySlug: category });
    const popular = useSearchPlaces({ sort: 'POPULAR', size: 10, categorySlugs: category ? [category] : undefined });
    const feed = useReviewFeed();

    const reviews = feed.data?.pages.flatMap((p) => p.content) ?? [];

    const header = (
        <View style={[styles.header, { paddingTop: insets.top }]}>
            <LargeTitle title={t('explore.title')} />

            {categories.data && categories.data.length > 0 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chips}>
                    <Chip label={t('explore.all')} selected={!category} onPress={() => setCategory(undefined)} />
                    {categories.data.map((c) => (
                        <Chip
                            key={c.id}
                            label={c.name}
                            selected={category === c.slug}
                            onPress={() => setCategory(category === c.slug ? undefined : c.slug)}
                        />
                    ))}
                </ScrollView>
            )}

            <SectionHeader
                title={t('explore.nearby')}
                action={{ label: t('common.action.see_all'), onPress: () => router.navigate('/') }}
            />
            {/* key theo danh mục: đổi chip thì hàng cuộn ngang về đầu, không giữ vị trí cũ. */}
            <PlaceShelf
                key={`nearby-${category ?? 'all'}`}
                places={nearby.data?.content}
                isError={nearby.isError}
                onRetry={() => void nearby.refetch()}
                emptyText={t('explore.nearby_empty')}
            />

            <SectionHeader title={t('explore.popular')} />
            <PlaceShelf
                key={`popular-${category ?? 'all'}`}
                places={popular.data?.content}
                isError={popular.isError}
                onRetry={() => void popular.refetch()}
                emptyText={t('explore.popular_empty')}
            />

            <SectionHeader title={t('explore.feed')} />
        </View>
    );

    return (
        <View style={styles.screen}>
            <FlashList
                data={reviews}
                masonry
                numColumns={2}
                keyExtractor={(r) => r.id}
                renderItem={({ item }) => (
                    <View style={styles.cell}>
                        <PostCard review={item} />
                    </View>
                )}
                ListHeaderComponent={header}
                ListEmptyComponent={
                    feed.isPending ? (
                        <LoadingState />
                    ) : feed.isError ? (
                        <ErrorState onRetry={() => void feed.refetch()} />
                    ) : (
                        <EmptyState
                            icon="newspaper-outline"
                            title={t('explore.feed_empty')}
                            message={t('explore.feed_empty_hint')}
                        />
                    )
                }
                ListFooterComponent={
                    <View style={{ height: tabBarInset + Space.lg }}>
                        {feed.isFetchingNextPage && <ActivityIndicator color={Palette.brand} />}
                    </View>
                }
                onEndReached={() => {
                    if (feed.hasNextPage && !feed.isFetchingNextPage) void feed.fetchNextPage();
                }}
                onEndReachedThreshold={0.5}
                refreshing={false}
                onRefresh={() => {
                    void feed.refetch();
                    void nearby.refetch();
                    void popular.refetch();
                    void categories.refetch();
                }}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            />
            <StatusBarScrim />
        </View>
    );
}

type ShelfProps = {
    places: PlaceSummary[] | undefined;
    isError: boolean;
    onRetry: () => void;
    emptyText: string;
};

/** Một hàng thẻ địa điểm cuộn ngang, kèm trạng thái tải / lỗi / rỗng. */
function PlaceShelf({ places, isError, onRetry, emptyText }: ShelfProps) {
    const { t } = useTranslation();

    if (isError) {
        return (
            <View style={styles.shelfState}>
                <Text style={styles.shelfText}>{t('common.state.error')}</Text>
                <Text style={styles.retry} onPress={onRetry} accessibilityRole="button">
                    {t('common.action.retry')}
                </Text>
            </View>
        );
    }
    if (!places) {
        return (
            <View style={[styles.shelfState, styles.shelfLoading]}>
                <ActivityIndicator color={Palette.brand} />
            </View>
        );
    }
    if (places.length === 0) {
        return (
            <View style={styles.shelfState}>
                <Text style={styles.shelfText}>{emptyText}</Text>
            </View>
        );
    }
    return (
        <View style={styles.shelf}>
            <FlashList
                horizontal
                data={places}
                // FlashList v2 mặc định giữ vị trí khi dữ liệu đổi — đổi danh mục thì phải về đầu hàng.
                maintainVisibleContentPosition={{ disabled: true }}
                keyExtractor={(p) => p.id}
                renderItem={({ item }) => <PlaceCard place={item} />}
                ItemSeparatorComponent={() => <View style={{ width: Space.md }} />}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.shelfContent}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Palette.surface },
    // Lề ngoài 20 − đệm ô 5 = mép thẻ thẳng hàng với tiêu đề.
    content: { paddingHorizontal: Space.xl - GRID_GAP / 2 },
    // Header trải hết bề ngang, bù lại lề của lưới.
    header: { marginHorizontal: -(Space.xl - GRID_GAP / 2) },
    cell: { paddingHorizontal: GRID_GAP / 2, paddingBottom: GRID_GAP },
    chips: { gap: Space.sm, paddingHorizontal: Space.xl, paddingBottom: Space.xl },
    // Thẻ có bóng — chừa chỗ để bóng không bị cắt.
    shelf: { height: 236, marginBottom: Space.xl },
    shelfContent: { paddingHorizontal: Space.xl, paddingVertical: 6 },
    shelfState: {
        marginHorizontal: Space.xl,
        marginBottom: Space.xl,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Space.md,
    },
    shelfLoading: { height: 120, justifyContent: 'center' },
    shelfText: { ...Type.subheadline, color: Palette.textSecondary },
    retry: { ...Type.subheadline, fontWeight: '600', color: Palette.primary },
});
