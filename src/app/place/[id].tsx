import Ionicons from '@expo/vector-icons/Ionicons';
import { FlashList } from '@shopify/flash-list';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api, errorCodeOf, errorMessageOf } from '@/api/client';
import type { components } from '@/api/generated/schema';
import { qk } from '@/api/queryKeys';
import { Avatar } from '@/components/avatar';
import { GlassSurface } from '@/components/glass-surface';
import { StatusBarScrim } from '@/components/large-title';
import { PlaceArt } from '@/components/place-art';
import { RatingLabel, Stars } from '@/components/rating-label';
import { SectionHeader } from '@/components/section-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/state-view';
import { CardShadow, Palette, Radius, Space, Type } from '@/constants/theme';
import { nextPageOf } from '@/features/me/useMeQueries';
import { getCurrentLocale } from '@/i18n';

type PlaceDetail = components['schemas']['PlaceDetail'];
type Review = components['schemas']['Review'];
type OpeningHourRange = components['schemas']['OpeningHourRange'];
type ExternalLink = components['schemas']['PlaceExternalLink'];
type ExternalPlatform = components['schemas']['ExternalPlatform'];
type IconName = ComponentProps<typeof Ionicons>['name'];

const HERO_HEIGHT = 260;
const VN_TIME_ZONE = 'Asia/Ho_Chi_Minh';

/**
 * Chi tiết địa điểm. Nằm trên Stack gốc (không dưới tab), nên không có thanh tab nổi —
 * đáy chỉ cần tránh safe area.
 */
export default function PlaceDetailScreen() {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();
    // Cuộn qua ảnh hero thì phủ nền dưới thanh trạng thái, kẻo chữ đè lên giờ/pin.
    const [pastHero, setPastHero] = useState(false);

    const place = useQuery({
        queryKey: qk.places.detail(id),
        queryFn: async () => {
            const { data, error, response } = await api.GET('/api/v1/places/{placeId}', {
                params: { path: { placeId: id } },
            });
            // 404 là một kết quả ("không tìm thấy"), không phải lỗi mạng để thử lại.
            if (response.status === 404) return null;
            if (error) throw error;
            return data;
        },
    });

    const reviews = useInfiniteQuery({
        queryKey: qk.reviews.byPlace(id),
        enabled: !!place.data,
        initialPageParam: 0,
        getNextPageParam: nextPageOf,
        queryFn: async ({ pageParam }) => {
            const { data, error } = await api.GET('/api/v1/places/{placeId}/reviews', {
                params: { path: { placeId: id }, query: { page: pageParam, size: 20 } },
            });
            if (error) throw error;
            return data;
        },
    });

    const back = <BackButton top={insets.top + Space.sm} />;

    if (place.isPending || place.isError || !place.data) {
        let body;
        if (place.isPending) body = <LoadingState />;
        else if (place.isError) body = <ErrorState onRetry={() => void place.refetch()} />;
        else
            body = (
                <EmptyState
                    icon="storefront-outline"
                    title={t('place.detail.not_found')}
                    message={t('place.detail.not_found_hint')}
                    action={{ label: t('common.action.back'), onPress: () => router.back() }}
                />
            );
        return (
            <View style={[styles.screen, styles.centered]}>
                {body}
                {back}
            </View>
        );
    }

    const data = place.data;
    const items = reviews.data?.pages.flatMap((p) => p.content) ?? [];

    let reviewsState: ReactNode = null;
    if (reviews.isPending) reviewsState = <LoadingState />;
    else if (reviews.isError) reviewsState = <ErrorState onRetry={() => void reviews.refetch()} />;
    else
        reviewsState = (
            <EmptyState
                icon="chatbubble-ellipses-outline"
                title={t('place.detail.reviews_empty')}
                message={t('place.detail.reviews_empty_hint')}
            />
        );

    return (
        <View style={styles.screen}>
            <FlashList
                data={items}
                keyExtractor={(r) => r.id}
                renderItem={({ item }) => <ReviewItem review={item} />}
                ItemSeparatorComponent={() => <View style={styles.gap} />}
                ListHeaderComponent={<PlaceHeader place={data} />}
                ListEmptyComponent={reviewsState}
                ListFooterComponent={
                    <View style={{ height: insets.bottom + Space.xxl }}>
                        {reviews.isFetchingNextPage && <ActivityIndicator color={Palette.brand} />}
                    </View>
                }
                onEndReached={() => {
                    if (reviews.hasNextPage && !reviews.isFetchingNextPage) void reviews.fetchNextPage();
                }}
                onScroll={(e) => setPastHero(e.nativeEvent.contentOffset.y > HERO_HEIGHT)}
                scrollEventThrottle={64}
            />
            {pastHero && <StatusBarScrim />}
            {back}
        </View>
    );
}

/** Nút quay lại nổi bằng kính, đè lên ảnh hero (Stack ẩn header). */
function BackButton({ top }: { top: number }) {
    const { t } = useTranslation();
    return (
        <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            accessibilityRole="button"
            accessibilityLabel={t('common.action.back')}
            hitSlop={8}
            style={[styles.back, { top }]}>
            <GlassSurface radius={20} />
            <Ionicons name="chevron-back" size={22} color={Palette.onSurface} />
        </Pressable>
    );
}

function PlaceHeader({ place }: { place: PlaceDetail }) {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const subtitle = [t(`place.type.${place.placeType}`), ...place.categories.map((c) => c.name)].join(' · ');
    const heroImage = place.images[0]?.url ?? place.coverImageUrl;

    return (
        <View>
            <PlaceArt
                placeType={place.placeType}
                imageUrl={heroImage}
                iconSize={72}
                style={{ height: HERO_HEIGHT + insets.top }}
            />

            <View style={styles.sheet}>
                <Text style={styles.name}>{place.name}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>

                <View style={styles.metaRow}>
                    {/* averageRating null = chưa có đánh giá, KHÔNG hiện ★0 (FR-PLACE-12) */}
                    <RatingLabel rating={place.averageRating} count={place.averageRating == null ? undefined : place.reviewCount} />
                    <StatusPill place={place} />
                </View>

                <Text style={styles.visits}>
                    {t('place.detail.visits', { count: place.visitCount })}
                    {place.ownVisitCount ? ` · ${t('place.detail.own_visits', { count: place.ownVisitCount })}` : ''}
                </Text>

                <PlaceActions place={place} />
            </View>

            <View style={styles.sections}>
                {(place.address || place.phone) && (
                    <View style={styles.card}>
                        {place.address ? <InfoRow icon="location" text={place.address} /> : null}
                        {place.address && place.phone ? <View style={styles.separator} /> : null}
                        {place.phone ? (
                            <InfoRow
                                icon="call"
                                text={place.phone}
                                onPress={() => void Linking.openURL(`tel:${place.phone}`)}
                            />
                        ) : null}
                    </View>
                )}

                {place.description ? (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>{t('place.detail.about')}</Text>
                        <Text style={styles.body}>{place.description}</Text>
                    </View>
                ) : null}

                {place.openingHours.length > 0 && <OpeningHours ranges={place.openingHours} />}

                {place.externalLinks.length > 0 && <ExternalLinks links={place.externalLinks} />}
            </View>

            <SectionHeader
                title={place.reviewCount > 0 ? `${t('place.detail.reviews')} (${place.reviewCount})` : t('place.detail.reviews')}
            />
        </View>
    );
}

/** Đóng cửa hẳn/tạm đóng ưu tiên hơn "đang mở" — quán tạm đóng thì giờ mở cửa không còn ý nghĩa. */
function StatusPill({ place }: { place: PlaceDetail }) {
    const { t } = useTranslation();
    let label: string;
    let color: string;
    if (place.status === 'PERMANENTLY_CLOSED') {
        label = t('place.detail.permanently_closed');
        color = Palette.error;
    } else if (place.status === 'TEMPORARILY_CLOSED') {
        label = t('place.detail.temporarily_closed');
        color = Palette.primary;
    } else if (place.isOpenNow != null) {
        label = place.isOpenNow ? t('place.detail.open_now') : t('place.detail.closed_now');
        color = place.isOpenNow ? Palette.secondary : Palette.textSecondary;
    } else {
        return null;
    }
    return (
        <View style={styles.pill}>
            <View style={[styles.dot, { backgroundColor: color }]} />
            <Text style={[styles.pillLabel, { color }]}>{label}</Text>
        </View>
    );
}

/** Chỉ đường · Yêu thích · Đã đến — chỉ những hành động hợp đồng API đã có endpoint. */
function PlaceActions({ place }: { place: PlaceDetail }) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const detailKey = qk.places.detail(place.id);
    const favorited = place.isFavorited === true;

    const favorite = useMutation({
        mutationFn: async (next: boolean) => {
            const params = { params: { path: { placeId: place.id } } };
            if (next) {
                const { error } = await api.PUT('/api/v1/me/favorites/{placeId}', params);
                if (error) throw error;
            } else {
                const { error } = await api.DELETE('/api/v1/me/favorites/{placeId}', params);
                if (error) throw error;
            }
        },
        onSuccess: (_, next) => {
            queryClient.setQueryData<PlaceDetail | null>(detailKey, (p) => (p ? { ...p, isFavorited: next } : p));
            void queryClient.invalidateQueries({ queryKey: qk.favorites.all });
        },
        onError: (error) => Alert.alert(t('common.state.error'), errorMessageOf(error, t('common.state.error_hint'))),
    });

    const visit = useMutation({
        mutationFn: async () => {
            let position: Location.LocationObject;
            try {
                position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            } catch {
                // GPS tắt / không lấy được vị trí — báo bằng mã riêng để hiện chuỗi đã dịch.
                throw { code: 'LOCATION_UNAVAILABLE' };
            }
            const { data, error } = await api.POST('/api/v1/places/{placeId}/visits', {
                params: { path: { placeId: place.id } },
                body: { coordinates: { latitude: position.coords.latitude, longitude: position.coords.longitude } },
            });
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            Alert.alert(t('place.visit.success'));
            void queryClient.invalidateQueries({ queryKey: detailKey });
            void queryClient.invalidateQueries({ queryKey: qk.visits.mine });
        },
        onError: (error) =>
            Alert.alert(
                t('common.state.error'),
                errorCodeOf(error) === 'LOCATION_UNAVAILABLE'
                    ? t('place.visit.location_unavailable')
                    : errorMessageOf(error, t('place.visit.failed')),
            ),
    });

    /** Xin quyền vị trí đúng lúc bấm; từ chối thì giải thích và cho mở Cài đặt. */
    const onVisit = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== Location.PermissionStatus.GRANTED) {
            Alert.alert(t('permission.location.title'), t('place.visit.permission_message'), [
                { text: t('common.action.cancel'), style: 'cancel' },
                { text: t('common.action.open_settings'), onPress: () => void Linking.openSettings() },
            ]);
            return;
        }
        visit.mutate();
    };

    return (
        <View style={styles.actions}>
            <ActionButton icon="navigate" label={t('place.action.directions')} onPress={() => openDirections(place)} />
            <ActionButton
                icon={favorited ? 'heart' : 'heart-outline'}
                label={favorited ? t('place.action.remove_favorite') : t('place.action.add_favorite')}
                active={favorited}
                loading={favorite.isPending}
                onPress={() => favorite.mutate(!favorited)}
            />
            {/* Quán đã đóng hẳn thì không ghi lượt đến được (backend trả 404) */}
            {place.status !== 'PERMANENTLY_CLOSED' && (
                <ActionButton
                    icon="footsteps"
                    label={t('place.action.check_in')}
                    active={!!place.ownVisitCount}
                    loading={visit.isPending}
                    onPress={() => void onVisit()}
                />
            )}
        </View>
    );
}

/** Mở app bản đồ ngoài; không có app nào nhận thì rơi về Google Maps trên web. */
function openDirections(place: PlaceDetail) {
    const { latitude, longitude } = place.coordinates;
    const label = encodeURIComponent(place.name);
    const url =
        Platform.OS === 'ios'
            ? `maps://?daddr=${latitude},${longitude}&q=${label}`
            : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`;
    Linking.openURL(url).catch(() =>
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`),
    );
}

function ActionButton({
    icon,
    label,
    onPress,
    active,
    loading,
}: {
    icon: IconName;
    label: string;
    onPress: () => void;
    active?: boolean;
    loading?: boolean;
}) {
    return (
        <Pressable
            onPress={onPress}
            disabled={loading}
            accessibilityRole="button"
            accessibilityState={{ selected: active, busy: loading }}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
            <View style={[styles.actionIcon, active && styles.actionIconActive]}>
                {loading ? (
                    <ActivityIndicator color={active ? Palette.white : Palette.brand} />
                ) : (
                    <Ionicons name={icon} size={22} color={active ? Palette.white : Palette.brand} />
                )}
            </View>
            <Text style={styles.actionLabel} numberOfLines={1}>
                {label}
            </Text>
        </Pressable>
    );
}

function InfoRow({ icon, text, onPress }: { icon: IconName; text: string; onPress?: () => void }) {
    return (
        <Pressable
            onPress={onPress}
            disabled={!onPress}
            accessibilityRole={onPress ? 'button' : undefined}
            style={({ pressed }) => [styles.infoRow, pressed && styles.pressed]}>
            <Ionicons name={icon} size={18} color={Palette.brand} />
            <Text style={[styles.body, styles.flex, onPress && styles.link]}>{text}</Text>
        </Pressable>
    );
}

/** Thứ trong tuần theo ISO (1 = thứ Hai … 7 = Chủ nhật), hôm nay tính theo giờ Việt Nam. */
function todayIsoDay(): number {
    const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: VN_TIME_ZONE }).format(new Date());
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(weekday) + 1;
}

function OpeningHours({ ranges }: { ranges: OpeningHourRange[] }) {
    const { t } = useTranslation();
    const dayName = new Intl.DateTimeFormat(getCurrentLocale(), { weekday: 'long', timeZone: 'UTC' });
    const today = todayIsoDay();

    return (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('place.detail.opening_hours')}</Text>
            {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                const own = ranges.filter((r) => r.dayOfWeek === day);
                let hours = '–';
                if (own.some((r) => r.isClosedAllDay)) hours = t('place.detail.closed_all_day');
                else if (own.length > 0) hours = own.map((r) => `${r.openTime ?? ''}–${r.closeTime ?? ''}`).join(', ');
                const isToday = day === today;
                return (
                    <View key={day} style={styles.hourRow}>
                        {/* 2024-01-01 là thứ Hai — ngày `day` của tuần đó cho đúng tên thứ theo ngôn ngữ. */}
                        <Text style={[styles.body, styles.flex, isToday && styles.bold]}>
                            {dayName.format(new Date(Date.UTC(2024, 0, day)))}
                        </Text>
                        <Text style={[styles.body, isToday && styles.bold]}>{hours}</Text>
                    </View>
                );
            })}
        </View>
    );
}

/** Tên thương hiệu không dịch; chỉ OTHER cần chuỗi i18n. Nền tảng lạ (enum mới) rơi về OTHER. */
const PLATFORMS: Record<ExternalPlatform, { icon: IconName; name: string; color: string }> = {
    TIKTOK: { icon: 'logo-tiktok', name: 'TikTok', color: '#000000' },
    FACEBOOK: { icon: 'logo-facebook', name: 'Facebook', color: '#1877F2' },
    INSTAGRAM: { icon: 'logo-instagram', name: 'Instagram', color: '#E1306C' },
    YOUTUBE: { icon: 'logo-youtube', name: 'YouTube', color: '#FF0000' },
    OTHER: { icon: 'link', name: '', color: Palette.textSecondary },
};

/** Liên kết sang bài review trên nền tảng khác. Chỉ mở https — URL do admin nhập. */
function ExternalLinks({ links }: { links: ExternalLink[] }) {
    const { t } = useTranslation();
    return (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('place.detail.external_links')}</Text>
            {links
                .filter((link) => link.url.startsWith('https://'))
                .map((link, i) => {
                    const platform = PLATFORMS[link.platform] ?? PLATFORMS.OTHER;
                    const name = platform.name || t('place.detail.external_other');
                    return (
                        <View key={link.id}>
                            {i > 0 && <View style={styles.separator} />}
                            <Pressable
                                onPress={() => void Linking.openURL(link.url)}
                                accessibilityRole="link"
                                accessibilityLabel={link.title ? `${name}: ${link.title}` : name}
                                style={({ pressed }) => [styles.infoRow, pressed && styles.pressed]}>
                                <Ionicons name={platform.icon} size={20} color={platform.color} />
                                <View style={styles.flex}>
                                    <Text style={styles.body} numberOfLines={1}>
                                        {link.title ?? name}
                                    </Text>
                                    {link.title ? <Text style={styles.linkPlatform}>{name}</Text> : null}
                                </View>
                                <Ionicons name="open-outline" size={18} color={Palette.textSecondary} />
                            </Pressable>
                        </View>
                    );
                })}
        </View>
    );
}

function ReviewItem({ review }: { review: Review }) {
    const { t } = useTranslation();
    const date = new Intl.DateTimeFormat(getCurrentLocale(), { dateStyle: 'medium', timeZone: VN_TIME_ZONE }).format(
        new Date(review.createdAt),
    );
    const images = review.media.filter((m) => m.mediaType === 'IMAGE').slice(0, 3);

    return (
        <View style={styles.review}>
            <View style={styles.reviewHead}>
                <Avatar name={review.author.displayName} url={review.author.avatarUrl} size={36} />
                <View style={styles.flex}>
                    <Text style={styles.author} numberOfLines={1}>
                        {review.author.displayName}
                    </Text>
                    <Text style={styles.caption}>{date}</Text>
                </View>
                {/* API trả cả bài chưa duyệt của chính người gọi — luôn kèm nhãn trạng thái. */}
                {review.status !== 'APPROVED' && (
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusLabel}>{t(`review.status.${review.status}`)}</Text>
                    </View>
                )}
            </View>
            <Stars rating={review.rating} size={14} />
            {review.content ? <Text style={styles.body}>{review.content}</Text> : null}
            {images.length > 0 && (
                <View style={styles.thumbs}>
                    {images.map((m) => (
                        <Image key={m.id} source={m.thumbnailUrl ?? m.url} style={styles.thumb} contentFit="cover" />
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    linkPlatform: { ...Type.footnote, color: Palette.textSecondary },
    screen: { flex: 1, backgroundColor: Palette.surface },
    centered: { justifyContent: 'center' },
    flex: { flex: 1 },
    pressed: { opacity: 0.7 },
    back: {
        position: 'absolute',
        left: Space.lg,
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sheet: {
        marginTop: -Radius.xl,
        borderTopLeftRadius: Radius.xl,
        borderTopRightRadius: Radius.xl,
        backgroundColor: Palette.surface,
        paddingHorizontal: Space.xl,
        paddingTop: Space.xl,
        gap: Space.xs,
    },
    name: { ...Type.title2, color: Palette.onSurface },
    subtitle: { ...Type.subheadline, color: Palette.textSecondary },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: Space.md, marginTop: Space.xs },
    pill: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    pillLabel: { ...Type.footnote, fontWeight: '600' },
    visits: { ...Type.footnote, color: Palette.textSecondary },
    actions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: Space.lg },
    action: { alignItems: 'center', gap: Space.xs, flex: 1 },
    actionIcon: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(226,114,91,0.12)',
    },
    actionIconActive: { backgroundColor: Palette.brand },
    actionLabel: { ...Type.footnote, color: Palette.onSurface },
    sections: { padding: Space.lg, gap: Space.md, marginTop: Space.sm },
    card: {
        backgroundColor: Palette.card,
        borderRadius: Radius.lg,
        padding: Space.lg,
        gap: Space.sm,
        boxShadow: CardShadow,
    },
    cardTitle: { ...Type.headline, color: Palette.onSurface },
    body: { ...Type.subheadline, color: Palette.onSurface },
    bold: { fontWeight: '600' },
    link: { color: Palette.primary },
    separator: { height: StyleSheet.hairlineWidth, backgroundColor: Palette.separator, marginLeft: 30 },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.md },
    hourRow: { flexDirection: 'row', gap: Space.md },
    gap: { height: Space.md },
    review: {
        marginHorizontal: Space.lg,
        padding: Space.lg,
        gap: Space.sm,
        borderRadius: Radius.lg,
        backgroundColor: Palette.card,
        boxShadow: CardShadow,
    },
    reviewHead: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
    author: { ...Type.headline, color: Palette.onSurface },
    caption: { ...Type.caption, color: Palette.textSecondary },
    statusBadge: {
        paddingHorizontal: Space.sm,
        paddingVertical: 3,
        borderRadius: Radius.pill,
        backgroundColor: Palette.fill,
    },
    statusLabel: { ...Type.caption, fontWeight: '700', color: Palette.onSurface },
    thumbs: { flexDirection: 'row', gap: Space.sm },
    thumb: { width: 88, height: 88, borderRadius: Radius.sm },
});
