import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTabBarInset } from '@/components/glass-tab-bar';
import { LargeTitle, StatusBarScrim } from '@/components/large-title';
import { PlaceRow } from '@/components/place-row';
import { EmptyState, ErrorState, LoadingState } from '@/components/state-view';
import { Palette, Radius, Space } from '@/constants/theme';
import { useFavorites } from '@/features/me/useMeQueries';

/** Danh sách quán đã lưu (yêu thích). */
export default function FavoritesScreen() {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const tabBarInset = useTabBarInset();
    const favorites = useFavorites();

    const places = favorites.data?.pages.flatMap((p) => p.content) ?? [];

    let empty;
    if (favorites.isPending) {
        empty = <LoadingState />;
    } else if (favorites.isError) {
        empty = <ErrorState onRetry={() => void favorites.refetch()} />;
    } else {
        empty = (
            <EmptyState
                icon="heart-outline"
                title={t('favorites.empty')}
                message={t('favorites.empty_hint')}
                action={{ label: t('favorites.explore_action'), onPress: () => router.navigate('/explore') }}
            />
        );
    }

    return (
        <View style={styles.screen}>
            <FlashList
                data={places}
                keyExtractor={(p) => p.id}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <PlaceRow place={item} onPress={() => router.push(`/place/${item.id}`)} />
                    </View>
                )}
                ItemSeparatorComponent={() => <View style={styles.gap} />}
                ListHeaderComponent={
                    <View style={{ paddingTop: insets.top }}>
                        <LargeTitle title={t('favorites.title')} />
                    </View>
                }
                ListEmptyComponent={<View style={styles.empty}>{empty}</View>}
                ListFooterComponent={
                    <View style={{ height: tabBarInset + Space.lg }}>
                        {favorites.isFetchingNextPage && <ActivityIndicator color={Palette.brand} />}
                    </View>
                }
                onEndReached={() => {
                    if (favorites.hasNextPage && !favorites.isFetchingNextPage) void favorites.fetchNextPage();
                }}
                refreshing={false}
                onRefresh={() => void favorites.refetch()}
            />
            <StatusBarScrim />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Palette.surface },
    card: {
        marginHorizontal: Space.lg,
        borderRadius: Radius.lg,
        backgroundColor: Palette.card,
        paddingVertical: Space.xs,
    },
    gap: { height: Space.sm },
    empty: { paddingTop: Space.xxxl * 2 },
});
