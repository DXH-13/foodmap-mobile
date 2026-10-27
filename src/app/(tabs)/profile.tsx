import Ionicons from '@expo/vector-icons/Ionicons';
import { FlashList } from '@shopify/flash-list';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api } from '@/api/client';
import type { components } from '@/api/generated/schema';
import { qk } from '@/api/queryKeys';
import { Avatar } from '@/components/avatar';
import { useTabBarInset } from '@/components/glass-tab-bar';
import { InsetGroup, InsetRow } from '@/components/inset-group';
import { LargeTitle, StatusBarScrim } from '@/components/large-title';
import { PostCard } from '@/components/post-card';
import { SegmentedControl } from '@/components/segmented-control';
import { EmptyState, ErrorState, LoadingState } from '@/components/state-view';
import { CardShadow, Palette, Radius, Space, Type } from '@/constants/theme';
import { useMe, useMeCounts, useOwnReviews, useOwnVisits } from '@/features/me/useMeQueries';
import { changeLocale, getCurrentLocale, SUPPORTED_LOCALES } from '@/i18n';
import { useAuthStore } from '@/store/auth';

type Visit = components['schemas']['Visit'];
type Segment = 'posts' | 'visits';

const GRID_GAP = 10;

export default function ProfileScreen() {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const tabBarInset = useTabBarInset();
    const [segment, setSegment] = useState<Segment>('posts');

    const reviews = useOwnReviews(segment === 'posts');
    const visits = useOwnVisits(segment === 'visits');

    const header = (
        <View style={{ paddingTop: insets.top }}>
            <LargeTitle title={t('profile.title')} />
            <View style={styles.signedInHeader}>
                <ProfileHeader onSelectSegment={setSegment} />
                <SegmentedControl
                    options={[
                        { value: 'posts', label: t('profile.segment.posts') },
                        { value: 'visits', label: t('profile.segment.visits') },
                    ]}
                    value={segment}
                    onChange={setSegment}
                />
            </View>
        </View>
    );

    const footer = (
        <View style={{ paddingBottom: tabBarInset + Space.lg }}>
            <Settings />
        </View>
    );

    if (segment === 'posts') {
        const items = reviews.data?.pages.flatMap((p) => p.content) ?? [];
        return (
            <View style={styles.screen}>
                <FlashList
                    key="posts"
                    data={items}
                    masonry
                    numColumns={2}
                    keyExtractor={(r) => r.id}
                    renderItem={({ item }) => (
                        <View style={styles.cell}>
                            <PostCard review={item} showStatus />
                        </View>
                    )}
                    ListHeaderComponent={<View style={styles.gridHeader}>{header}</View>}
                    ListEmptyComponent={listState(reviews, {
                        icon: 'create-outline',
                        title: t('profile.posts_empty'),
                        message: t('profile.posts_empty_hint'),
                    })}
                    ListFooterComponent={<View style={styles.gridHeader}>{footer}</View>}
                    onEndReached={() => {
                        if (reviews.hasNextPage && !reviews.isFetchingNextPage) void reviews.fetchNextPage();
                    }}
                    contentContainerStyle={styles.grid}
                />
                <StatusBarScrim />
            </View>
        );
    }

    const items = visits.data?.pages.flatMap((p) => p.content) ?? [];
    return (
        <View style={styles.screen}>
            <FlashList
                key="visits"
                data={items}
                keyExtractor={(v) => v.id}
                renderItem={({ item }) => <VisitRow visit={item} />}
                ItemSeparatorComponent={() => <View style={styles.visitGap} />}
                ListHeaderComponent={header}
                ListEmptyComponent={listState(visits, {
                    icon: 'footsteps-outline',
                    title: t('profile.visits_empty'),
                    message: t('profile.visits_empty_hint'),
                })}
                ListFooterComponent={footer}
                onEndReached={() => {
                    if (visits.hasNextPage && !visits.isFetchingNextPage) void visits.fetchNextPage();
                }}
            />
            <StatusBarScrim />
        </View>
    );
}

/** Nội dung khi danh sách rỗng: đang tải / lỗi / thật sự rỗng. */
function listState(
    query: { isPending: boolean; isError: boolean; refetch: () => unknown },
    empty: { icon: 'create-outline' | 'footsteps-outline'; title: string; message: string },
): ReactElement {
    if (query.isPending) return <LoadingState />;
    if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />;
    return <EmptyState {...empty} />;
}

/** Avatar, tên, email, huy hiệu, và hàng thống kê Bài viết · Yêu thích · Đã đến. */
function ProfileHeader({ onSelectSegment }: { onSelectSegment: (s: Segment) => void }) {
    const { t } = useTranslation();
    const me = useMe();
    const counts = useMeCounts();
    // Hồ sơ trả về lúc đăng nhập — hiện ngay trong lúc chờ /me (hoặc khi /me lỗi).
    const sessionUser = useAuthStore((s) => s.user);
    const user = me.data ?? sessionUser;

    if (!user) {
        return me.isError ? <ErrorState onRetry={() => void me.refetch()} /> : <LoadingState />;
    }

    const format = (n: number | undefined) => (n == null ? '–' : new Intl.NumberFormat(getCurrentLocale()).format(n));

    return (
        <View style={styles.profile}>
            <Avatar name={user.displayName} url={user.avatarUrl} size={84} />
            <Text style={styles.name}>{user.displayName}</Text>
            <Text style={styles.email}>{user.email}</Text>
            <View style={styles.badges}>
                {user.emailVerified ? (
                    <Badge icon="checkmark-circle" label={t('profile.verified')} color={Palette.secondary} />
                ) : (
                    <Badge icon="alert-circle-outline" label={t('profile.unverified')} color={Palette.textSecondary} />
                )}
                {user.role !== 'USER' && (
                    <Badge icon="shield-checkmark" label={t(`profile.role.${user.role}`)} color={Palette.primary} />
                )}
            </View>

            <View style={styles.stats}>
                <Stat value={format(counts.reviews)} label={t('profile.stats.posts')} onPress={() => onSelectSegment('posts')} />
                <View style={styles.statDivider} />
                <Stat
                    value={format(counts.favorites)}
                    label={t('profile.stats.favorites')}
                    onPress={() => router.navigate('/favorites')}
                />
                <View style={styles.statDivider} />
                <Stat value={format(counts.visits)} label={t('profile.stats.visits')} onPress={() => onSelectSegment('visits')} />
            </View>
        </View>
    );
}

function Badge({ icon, label, color }: { icon: 'checkmark-circle' | 'alert-circle-outline' | 'shield-checkmark'; label: string; color: string }) {
    return (
        <View style={styles.badge}>
            <Ionicons name={icon} size={14} color={color} />
            <Text style={[styles.badgeLabel, { color }]}>{label}</Text>
        </View>
    );
}

function Stat({ value, label, onPress }: { value: string; label: string; onPress: () => void }) {
    return (
        <Pressable style={styles.stat} onPress={onPress} accessibilityRole="button">
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </Pressable>
    );
}

function VisitRow({ visit }: { visit: Visit }) {
    const { t } = useTranslation();
    // `visitDate` là ngày thuần (yyyy-MM-dd, giờ VN) — định dạng theo UTC để không bị lệch ngày.
    const date = new Intl.DateTimeFormat(getCurrentLocale(), { dateStyle: 'medium', timeZone: 'UTC' }).format(
        new Date(`${visit.visitDate}T00:00:00Z`),
    );
    return (
        <Pressable
            style={({ pressed }) => [styles.visit, pressed && styles.pressed]}
            onPress={() => router.push(`/place/${visit.placeId}`)}
            accessibilityRole="button">
            <View style={styles.visitIcon}>
                <Ionicons name="location" size={18} color={Palette.brand} />
            </View>
            <View style={styles.visitMain}>
                <Text style={styles.visitName} numberOfLines={1}>
                    {visit.placeName ?? t('profile.unknown_place')}
                </Text>
                <Text style={styles.visitDate}>{date}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Palette.separator} />
        </Pressable>
    );
}

/** Cài đặt kiểu inset grouped: Ngôn ngữ, Giới thiệu, Đăng xuất. */
function Settings() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const refreshToken = useAuthStore((s) => s.refreshToken);
    const clearSession = useAuthStore((s) => s.clearSession);
    const current = getCurrentLocale();

    const logout = useMutation({
        // Thu hồi refresh token ở server; lỗi mạng cũng không giữ người dùng lại — vẫn đăng xuất.
        mutationFn: async () => {
            if (refreshToken) await api.POST('/api/v1/auth/logout', { body: { refreshToken } });
        },
        onSettled: () => {
            clearSession();
            for (const key of [qk.me.profile, qk.reviews.mine, qk.favorites.all, qk.visits.mine]) {
                queryClient.removeQueries({ queryKey: key });
            }
        },
    });

    const confirmLogout = () =>
        Alert.alert(t('profile.logout_confirm_title'), t('profile.logout_confirm_message'), [
            { text: t('common.action.cancel'), style: 'cancel' },
            { text: t('profile.logout'), style: 'destructive', onPress: () => logout.mutate() },
        ]);

    const onChangeLocale = async (locale: (typeof SUPPORTED_LOCALES)[number]) => {
        await changeLocale(locale);
        // Tên quán, danh mục… được backend dịch theo Accept-Language — tải lại cho đúng ngôn ngữ.
        void queryClient.invalidateQueries();
    };

    return (
        <View style={styles.settings}>
            <InsetGroup header={t('profile.language')}>
                {SUPPORTED_LOCALES.map((locale) => (
                    <InsetRow
                        key={locale}
                        icon="language"
                        iconColor={locale === 'vi' ? '#E2725B' : '#5B8DEF'}
                        label={t(`profile.locale_name.${locale}`)}
                        checked={current === locale}
                        onPress={() => void onChangeLocale(locale)}
                    />
                ))}
            </InsetGroup>

            <InsetGroup header={t('profile.about')}>
                <InsetRow
                    icon="information-circle"
                    iconColor="#8E8E93"
                    label={t('profile.version')}
                    value={Constants.expoConfig?.version ?? '–'}
                />
            </InsetGroup>

            <InsetGroup>
                <InsetRow
                    icon="log-out-outline"
                    iconColor={Palette.error}
                    label={t('profile.logout')}
                    destructive
                    onPress={confirmLogout}
                />
            </InsetGroup>
            {logout.isPending && <ActivityIndicator color={Palette.brand} />}
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Palette.surface },
    signedInHeader: { paddingHorizontal: Space.lg, gap: Space.lg, paddingBottom: Space.lg },
    grid: { paddingHorizontal: Space.lg - GRID_GAP / 2 },
    gridHeader: { marginHorizontal: -(Space.lg - GRID_GAP / 2) },
    cell: { paddingHorizontal: GRID_GAP / 2, paddingBottom: GRID_GAP },
    profile: { alignItems: 'center', gap: Space.xs },
    name: { ...Type.title2, color: Palette.onSurface, marginTop: Space.sm },
    email: { ...Type.subheadline, color: Palette.textSecondary },
    badges: { flexDirection: 'row', gap: Space.sm, marginTop: Space.xs },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: Space.sm + 2,
        paddingVertical: 4,
        borderRadius: Radius.pill,
        backgroundColor: Palette.card,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: Palette.separator,
    },
    badgeLabel: { ...Type.caption, fontWeight: '600' },
    stats: {
        flexDirection: 'row',
        alignSelf: 'stretch',
        marginTop: Space.lg,
        paddingVertical: Space.md,
        borderRadius: Radius.lg,
        backgroundColor: Palette.card,
        boxShadow: CardShadow,
    },
    stat: { flex: 1, alignItems: 'center', gap: 2 },
    statValue: { ...Type.title3, color: Palette.onSurface },
    statLabel: { ...Type.footnote, color: Palette.textSecondary },
    statDivider: { width: StyleSheet.hairlineWidth, backgroundColor: Palette.separator },
    visit: {
        marginHorizontal: Space.lg,
        minHeight: 64,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Space.md,
        paddingHorizontal: Space.md,
        borderRadius: Radius.lg,
        backgroundColor: Palette.card,
    },
    pressed: { opacity: 0.7 },
    visitIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(226,114,91,0.12)',
    },
    visitMain: { flex: 1 },
    visitName: { ...Type.headline, color: Palette.onSurface },
    visitDate: { ...Type.footnote, color: Palette.textSecondary },
    visitGap: { height: Space.sm },
    settings: { gap: Space.xxl, paddingTop: Space.xl },
});
