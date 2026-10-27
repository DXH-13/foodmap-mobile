import Ionicons from '@expo/vector-icons/Ionicons';
import {
    Camera,
    Map,
    Marker,
    NativeUserLocation,
    type CameraRef,
    type LngLat,
} from '@maplibre/maplibre-react-native';
import { FlashList } from '@shopify/flash-list';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Keyboard, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { components } from '@/api/generated/schema';
import { GlassSurface } from '@/components/glass-surface';
import { useTabBarInset } from '@/components/glass-tab-bar';
import { PLACE_ICON } from '@/components/place-art';
import { PLACE_ROW_HEIGHT, PlaceRow } from '@/components/place-row';
import { SearchField } from '@/components/search-field';
import { Palette, Radius, Space, Type } from '@/constants/theme';
import { DEFAULT_CENTER, NEARBY_RADIUS_METERS, useNearbyPlaces } from '@/features/places/useNearbyPlaces';
import { useSearchPlaces } from '@/features/places/useSearchPlaces';

type PlaceSummary = components['schemas']['PlaceSummary'];

/**
 * Bản đồ nền dữ liệu OpenStreetMap từ OpenFreeMap — không cần khoá API, không giới hạn
 * lượt tải. Xem docs/SDD/kien-truc/adr/ADR-0005. Đổi kiểu bản đồ: `/styles/positron` (nhạt), `/styles/bright`.
 */
const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

/** TP.HCM — dùng khi chưa lấy được vị trí người dùng. Thứ tự là [kinh độ, vĩ độ]. */
const FALLBACK_CENTER: LngLat = [DEFAULT_CENTER.longitude, DEFAULT_CENTER.latitude];
const FALLBACK_ZOOM = 13;
const USER_ZOOM = 14;
const PLACE_ZOOM = 16;

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_HEIGHT = 48;
const PANEL_RADIUS = 24;
/** Thẻ kết quả cao tối đa 3,5 dòng — lộ nửa dòng thứ tư để người dùng biết còn cuộn được. */
const PANEL_MAX_ROWS = 3.5;
const FAB_SIZE = 44;

/**
 * Kính giả lập (Android, iOS < 26) không có blur: tên đường của bản đồ lộ xuyên qua làm
 * khó đọc danh sách kết quả. Thêm một lớp nền sáng riêng cho thẻ nhiều chữ này.
 */
const NEEDS_SCRIM = !isLiquidGlassAvailable();

type PermissionState = 'checking' | 'granted' | 'denied';

function useDebouncedValue<T>(value: T, ms: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), ms);
        return () => clearTimeout(id);
    }, [value, ms]);
    return debounced;
}

export default function MapScreen() {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const tabBarInset = useTabBarInset();
    const cameraRef = useRef<CameraRef>(null);

    const [permission, setPermission] = useState<PermissionState>('checking');
    // Chỉ đặt MỘT lần khi lấy được vị trí — sau đó người dùng tự kéo bản đồ.
    const [userCenter, setUserCenter] = useState<LngLat | undefined>(undefined);

    const [text, setText] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [panelHeight, setPanelHeight] = useState(0);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (cancelled) return;

            if (status !== Location.PermissionStatus.GRANTED) {
                setPermission('denied');
                return;
            }

            setPermission('granted');
            const position = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
            if (cancelled) return;

            const here: LngLat = [position.coords.longitude, position.coords.latitude];
            setUserCenter(here);
            cameraRef.current?.flyTo({ center: here, zoom: USER_ZOOM, duration: 800 });
        })().catch(() => {
            // GPS tắt / hết thời gian chờ: giữ vị trí mặc định, bản đồ vẫn dùng được.
        });

        return () => {
            cancelled = true;
        };
    }, []);

    // Quán gần bám theo VỊ TRÍ người dùng (hoặc TP.HCM khi chưa có), KHÔNG theo vùng bản
    // đồ đang xem: kéo bản đồ để ngó xung quanh không gọi lại API.
    const center = userCenter ?? FALLBACK_CENTER;
    const nearbyParams = useMemo(
        () => ({ latitude: center[1], longitude: center[0], radiusMeters: NEARBY_RADIUS_METERS }),
        [center],
    );
    const nearby = useNearbyPlaces(nearbyParams);

    const trimmed = text.trim();
    const isSearching = trimmed.length > 0;
    const query = useDebouncedValue(trimmed, SEARCH_DEBOUNCE_MS);
    const search = useSearchPlaces({ query, size: 20 }, query.length > 0);
    const results = isSearching ? search.data?.content : undefined;

    const markers: PlaceSummary[] = (isSearching ? results : nearby.data?.content) ?? [];

    const searchTop = insets.top + Space.sm;
    const ornamentTop = searchTop + SEARCH_HEIGHT + Space.sm;
    const panelBottom = tabBarInset;

    // Có kết quả mới → camera bay để thấy hết. Chạy theo `search.data` (đổi tham chiếu
    // mỗi lần có kết quả mới), không theo từng phím gõ.
    useEffect(() => {
        const places = search.data?.content;
        if (!places || places.length === 0 || query.length === 0) return;

        if (places.length === 1) {
            const p = places[0].coordinates;
            cameraRef.current?.flyTo({ center: [p.longitude, p.latitude], zoom: PLACE_ZOOM, duration: 700 });
            return;
        }
        const lngs = places.map((p) => p.coordinates.longitude);
        const lats = places.map((p) => p.coordinates.latitude);
        cameraRef.current?.fitBounds([Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)], {
            padding: {
                top: ornamentTop + 40,
                bottom: panelBottom + PANEL_MAX_ROWS * PLACE_ROW_HEIGHT + 60,
                left: 48,
                right: 48,
            },
            duration: 700,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ bay khi có kết quả mới
    }, [search.data]);

    const flyToPlace = (place: PlaceSummary) => {
        const { longitude, latitude } = place.coordinates;
        cameraRef.current?.flyTo({ center: [longitude, latitude], zoom: PLACE_ZOOM, duration: 600 });
    };

    // Bấm lần đầu: bay tới quán. Bấm lần nữa vào quán đang chọn: mở chi tiết.
    const onResultPress = (place: PlaceSummary) => {
        Keyboard.dismiss();
        if (selectedId === place.id) {
            router.push(`/place/${place.id}`);
            return;
        }
        setSelectedId(place.id);
        flyToPlace(place);
    };

    const onChangeText = (value: string) => {
        setText(value);
        setSelectedId(null);
    };

    const onClear = () => {
        setText('');
        setSelectedId(null);
        Keyboard.dismiss();
        cameraRef.current?.flyTo({ center, zoom: USER_ZOOM, duration: 600 });
    };

    const onLocate = () => {
        if (permission === 'denied') {
            void Linking.openSettings();
            return;
        }
        if (userCenter) {
            cameraRef.current?.flyTo({ center: userCenter, zoom: USER_ZOOM, duration: 600 });
        }
    };

    const panelVisible = isSearching;
    const fabBottom = panelBottom + (panelVisible ? panelHeight + Space.md : 0);

    return (
        <View style={styles.container}>
            <Map
                style={StyleSheet.absoluteFill}
                mapStyle={MAP_STYLE_URL}
                // TextureView thay cho SurfaceView mặc định: SurfaceView "đục lỗ" cửa sổ
                // app và lỗ vẫn còn khi chuyển tab → dải đen dưới thanh tab nổi ở các
                // tab khác. TextureView là view thường nên không bị vậy.
                androidView="texture"
                onPress={() => Keyboard.dismiss()}
                // Giấy phép ODbL của OpenStreetMap bắt buộc hiện ghi công — đừng tắt.
                // Đặt ngay dưới ô tìm kiếm: phía trên bị ô tìm kiếm che, phía dưới bị thẻ
                // kết quả và thanh tab nổi che.
                attribution
                attributionPosition={{ top: ornamentTop, right: Space.sm }}
                logoPosition={{ top: ornamentTop, left: Space.sm }}>
                <Camera ref={cameraRef} initialViewState={{ center: FALLBACK_CENTER, zoom: FALLBACK_ZOOM }} />

                {permission === 'granted' && <NativeUserLocation />}

                {markers.map((place) => (
                    <Marker
                        key={place.id}
                        id={place.id}
                        lngLat={[place.coordinates.longitude, place.coordinates.latitude]}
                        anchor="bottom"
                        onPress={() => router.push(`/place/${place.id}`)}>
                        <MarkerPin place={place} selected={place.id === selectedId} />
                    </Marker>
                ))}
            </Map>

            <SearchField
                style={[styles.search, { top: searchTop }]}
                value={text}
                onChangeText={onChangeText}
                onClear={onClear}
                placeholder={t('map.search.placeholder')}
            />

            <Pressable
                style={[styles.fab, { bottom: fabBottom }]}
                onPress={onLocate}
                accessibilityRole="button"
                accessibilityLabel={t('map.my_location')}>
                <GlassSurface radius={FAB_SIZE / 2} />
                <Ionicons name={userCenter ? 'navigate' : 'navigate-outline'} size={20} color={Palette.primary} />
            </Pressable>

            {/* Thông báo nhỏ khi chưa tìm: bị từ chối quyền vị trí, hoặc không tải được quán gần. */}
            {!isSearching && (permission === 'denied' || nearby.isError) && (
                <View style={[styles.notices, { bottom: panelBottom + FAB_SIZE + Space.md }]}>
                    {permission === 'denied' && (
                        <Notice
                            icon="location-outline"
                            message={t('permission.location.denied_short')}
                            actionLabel={t('common.action.open_settings')}
                            onAction={() => void Linking.openSettings()}
                        />
                    )}
                    {nearby.isError && (
                        <Notice
                            icon="cloud-offline-outline"
                            message={t('map.nearby_error')}
                            actionLabel={t('common.action.retry')}
                            onAction={() => void nearby.refetch()}
                        />
                    )}
                </View>
            )}

            {panelVisible && (
                <View
                    style={[styles.panel, { bottom: panelBottom }]}
                    onLayout={(e) => setPanelHeight(e.nativeEvent.layout.height)}>
                    <GlassSurface radius={PANEL_RADIUS} />
                    {NEEDS_SCRIM && <View style={styles.panelScrim} />}
                    <SearchResults
                        query={trimmed}
                        results={results}
                        isPending={search.isFetching || query !== trimmed}
                        isError={search.isError}
                        onRetry={() => void search.refetch()}
                        selectedId={selectedId}
                        onPress={onResultPress}
                    />
                </View>
            )}
        </View>
    );
}

type SearchResultsProps = {
    query: string;
    results: PlaceSummary[] | undefined;
    isPending: boolean;
    isError: boolean;
    onRetry: () => void;
    selectedId: string | null;
    onPress: (place: PlaceSummary) => void;
};

function SearchResults({ query, results, isPending, isError, onRetry, selectedId, onPress }: SearchResultsProps) {
    const { t } = useTranslation();

    if (isError) {
        return (
            <View style={styles.panelRow}>
                <Text style={styles.panelText}>{t('map.search.error')}</Text>
                <Pressable onPress={onRetry} hitSlop={8} accessibilityRole="button">
                    <Text style={styles.link}>{t('common.action.retry')}</Text>
                </Pressable>
            </View>
        );
    }

    if (!results || (isPending && results.length === 0)) {
        return (
            <View style={styles.panelRow}>
                <ActivityIndicator color={Palette.brand} />
                <Text style={styles.panelText}>{t('map.search.searching')}</Text>
            </View>
        );
    }

    if (results.length === 0) {
        return (
            <View style={styles.panelEmpty}>
                <Text style={styles.panelTitle}>{t('map.search.empty', { query })}</Text>
                <Text style={styles.panelText}>{t('map.search.empty_hint')}</Text>
            </View>
        );
    }

    return (
        <View>
            <View style={styles.panelHeader}>
                <Text style={styles.panelCaption}>{t('map.search.results', { count: results.length })}</Text>
                {isPending && <ActivityIndicator size="small" color={Palette.brand} />}
            </View>
            {/* FlashList cần khung có chiều cao cố định — tính từ số dòng. */}
            <View style={{ height: Math.min(results.length, PANEL_MAX_ROWS) * PLACE_ROW_HEIGHT }}>
                <FlashList
                    data={results}
                    keyExtractor={(p) => p.id}
                    keyboardShouldPersistTaps="handled"
                    extraData={selectedId}
                    renderItem={({ item }) => (
                        <PlaceRow place={item} selected={item.id === selectedId} onPress={() => onPress(item)} />
                    )}
                />
            </View>
        </View>
    );
}

/** Marker hình giọt nước: đầu tròn có glyph theo loại quán, mũi nhọn chỉ đúng toạ độ. */
function MarkerPin({ place, selected }: { place: PlaceSummary; selected: boolean }) {
    const size = selected ? 40 : 32;
    const bg = selected ? Palette.brand : Palette.white;
    return (
        <View style={styles.pinWrap} accessibilityLabel={place.name}>
            <View style={[styles.pinHead, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
                <Ionicons
                    name={PLACE_ICON[place.placeType]}
                    size={selected ? 20 : 16}
                    color={selected ? Palette.white : Palette.brand}
                />
            </View>
            <View style={[styles.pinTip, { backgroundColor: bg }]} />
        </View>
    );
}

type NoticeProps = {
    icon: ComponentProps<typeof Ionicons>['name'];
    message: string;
    actionLabel: string;
    onAction: () => void;
};

function Notice({ icon, message, actionLabel, onAction }: NoticeProps) {
    return (
        <View style={styles.notice}>
            <GlassSurface radius={Radius.lg} />
            {NEEDS_SCRIM && <View style={[styles.panelScrim, { borderRadius: Radius.lg }]} />}
            <Ionicons name={icon} size={18} color={Palette.onSurfaceVariant} />
            <Text style={styles.noticeText} numberOfLines={2}>
                {message}
            </Text>
            <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
                <Text style={styles.link}>{actionLabel}</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Palette.surface },
    search: { position: 'absolute', left: Space.lg, right: Space.lg },
    fab: {
        position: 'absolute',
        right: Space.lg,
        width: FAB_SIZE,
        height: FAB_SIZE,
        borderRadius: FAB_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 14px rgba(0,0,0,0.14)',
    },
    notices: { position: 'absolute', left: Space.lg, right: Space.lg, gap: Space.sm },
    notice: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Space.sm,
        paddingHorizontal: Space.md,
        paddingVertical: Space.md,
        borderRadius: Radius.lg,
        boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
    },
    noticeText: { ...Type.footnote, color: Palette.onSurface, flex: 1 },
    // Thẻ kính nổi ngay trên thanh tab — cùng ngôn ngữ với thanh tab, thấy bản đồ quanh nó.
    panel: {
        position: 'absolute',
        left: Space.lg,
        right: Space.lg,
        borderRadius: PANEL_RADIUS,
        padding: Space.sm,
        boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
    },
    panelScrim: {
        ...StyleSheet.absoluteFill,
        borderRadius: PANEL_RADIUS,
        backgroundColor: 'rgba(249,249,249,0.8)',
    },
    panelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Space.md,
        paddingTop: Space.xs,
        paddingBottom: Space.xs,
    },
    panelCaption: { ...Type.footnote, fontWeight: '600', color: Palette.textSecondary },
    panelRow: { flexDirection: 'row', alignItems: 'center', gap: Space.md, padding: Space.md },
    panelEmpty: { padding: Space.md, gap: 2 },
    panelTitle: { ...Type.headline, color: Palette.onSurface },
    panelText: { ...Type.subheadline, color: Palette.textSecondary, flex: 1 },
    link: { ...Type.subheadline, fontWeight: '600', color: Palette.primary },
    pinWrap: { alignItems: 'center' },
    pinHead: {
        zIndex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Palette.white,
        boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
    },
    pinTip: { width: 10, height: 10, marginTop: -6, transform: [{ rotate: '45deg' }] },
});
