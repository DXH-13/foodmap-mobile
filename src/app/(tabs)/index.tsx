import * as Location from 'expo-location';
import { Link } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Linking,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNearbyPlaces } from '@/features/places/useNearbyPlaces';

/** TP.HCM — dùng khi chưa lấy được vị trí người dùng. */
const FALLBACK_REGION: Region = {
    latitude: 10.7769,
    longitude: 106.7009,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
};

const MIN_RADIUS_METERS = 100;
const MAX_RADIUS_METERS = 50_000;

/** Suy bán kính từ vùng đang hiển thị, kẹp trong khoảng backend chấp nhận. */
function radiusFromRegion(region: Region): number {
    const metersPerDegreeLatitude = 111_320;
    const halfHeightMeters = (region.latitudeDelta / 2) * metersPerDegreeLatitude;
    return Math.round(Math.min(MAX_RADIUS_METERS, Math.max(MIN_RADIUS_METERS, halfHeightMeters)));
}

type PermissionState = 'checking' | 'granted' | 'denied';

export default function MapScreen() {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    const [permission, setPermission] = useState<PermissionState>('checking');
    const [region, setRegion] = useState<Region>(FALLBACK_REGION);
    // Tách khỏi `region`: chỉ cập nhật khi bản đồ NGỪNG di chuyển, nếu không mỗi
    // frame kéo bản đồ sẽ là một request mới.
    const [settledRegion, setSettledRegion] = useState<Region>(FALLBACK_REGION);

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

            const next: Region = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                latitudeDelta: 0.03,
                longitudeDelta: 0.03,
            };
            setRegion(next);
            setSettledRegion(next);
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const nearbyParams = useMemo(
        () => ({
            latitude: settledRegion.latitude,
            longitude: settledRegion.longitude,
            radiusMeters: radiusFromRegion(settledRegion),
        }),
        [settledRegion],
    );

    const { data, isPending, isError, refetch } = useNearbyPlaces(nearbyParams);

    const handleRegionChangeComplete = useCallback((next: Region) => {
        setSettledRegion(next);
    }, []);

    // Từ chối quyền vị trí KHÔNG được dẫn tới màn hình trắng — vẫn xem được bản đồ,
    // chỉ là bắt đầu từ vị trí mặc định, và có đường dẫn tới Cài đặt.
    if (permission === 'denied') {
        return (
            <View style={[styles.centered, { paddingTop: insets.top }]}>
                <Text style={styles.title}>{t('permission.location.title')}</Text>
                <Text style={styles.body}>{t('permission.location.denied')}</Text>
                <Pressable style={styles.button} onPress={() => void Linking.openSettings()}>
                    <Text style={styles.buttonLabel}>{t('common.action.open_settings')}</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                style={StyleSheet.absoluteFill}
                // Dùng provider Google trên CẢ hai nền tảng để giao diện và hành vi
                // giống nhau — mặc định của iOS là Apple Maps.
                provider={PROVIDER_GOOGLE}
                initialRegion={region}
                showsUserLocation={permission === 'granted'}
                onRegionChangeComplete={handleRegionChangeComplete}>
                {data?.content.map((place) => (
                    <Marker
                        key={place.id}
                        coordinate={{
                            latitude: place.coordinates.latitude,
                            longitude: place.coordinates.longitude,
                        }}
                        title={place.name}
                        description={place.address ?? undefined}
                    />
                ))}
            </MapView>

            <View style={[styles.panel, { paddingBottom: insets.bottom + 12 }]}>
                {isPending && <ActivityIndicator />}

                {isError && (
                    <View style={styles.row}>
                        <Text style={styles.body}>{t('common.state.error')}</Text>
                        <Pressable style={styles.buttonSmall} onPress={() => void refetch()}>
                            <Text style={styles.buttonLabel}>{t('common.action.retry')}</Text>
                        </Pressable>
                    </View>
                )}

                {data && data.content.length === 0 && (
                    <View>
                        <Text style={styles.body}>
                            {t('place.nearby.empty', {
                                radius: Math.round(nearbyParams.radiusMeters / 1000),
                            })}
                        </Text>
                        <Text style={styles.hint}>{t('place.nearby.empty_hint')}</Text>
                    </View>
                )}

                {data?.content.slice(0, 3).map((place) => (
                    <Link key={place.id} href={`/place/${place.id}`} asChild>
                        <Pressable style={styles.row}>
                            <View style={styles.rowMain}>
                                <Text style={styles.placeName} numberOfLines={1}>
                                    {place.name}
                                </Text>
                                <Text style={styles.hint}>
                                    {t(`place.type.${place.placeType}` as never)}
                                    {' · '}
                                    {place.averageRating == null
                                        ? t('place.detail.no_rating')
                                        : `★ ${place.averageRating}`}
                                </Text>
                            </View>
                            {place.distanceMeters != null && (
                                <Text style={styles.distance}>
                                    {place.distanceMeters < 1000
                                        ? t('place.nearby.distance', {
                                              meters: Math.round(place.distanceMeters),
                                          })
                                        : t('place.nearby.distance_km', {
                                              km: (place.distanceMeters / 1000).toFixed(1),
                                          })}
                                </Text>
                            )}
                        </Pressable>
                    </Link>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
    title: { fontSize: 18, fontWeight: '600' },
    body: { fontSize: 15, textAlign: 'center', opacity: 0.8 },
    hint: { fontSize: 13, opacity: 0.6 },
    button: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, backgroundColor: '#208AEF' },
    buttonSmall: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#208AEF' },
    buttonLabel: { color: '#fff', fontWeight: '600' },
    panel: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.94)' : '#fff',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingHorizontal: 16,
        paddingTop: 14,
        gap: 10,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    rowMain: { flex: 1 },
    placeName: { fontSize: 16, fontWeight: '600' },
    distance: { fontSize: 13, opacity: 0.6 },
});
