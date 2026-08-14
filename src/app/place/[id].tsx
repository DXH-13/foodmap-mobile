import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { api } from '@/api/client';
import { qk } from '@/api/queryKeys';

export default function PlaceDetailScreen() {
    const { t } = useTranslation();
    const { id } = useLocalSearchParams<{ id: string }>();

    const { data, isPending, isError, refetch } = useQuery({
        queryKey: qk.places.detail(id),
        queryFn: async () => {
            const { data, error } = await api.GET('/api/v1/places/{placeId}', {
                params: { path: { placeId: id } },
            });
            if (error) {
                throw error;
            }
            return data;
        },
    });

    if (isPending) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator />
            </View>
        );
    }

    if (isError || !data) {
        return (
            <View style={styles.centered}>
                <Text style={styles.body}>{t('common.state.error')}</Text>
                <Pressable style={styles.button} onPress={() => void refetch()}>
                    <Text style={styles.buttonLabel}>{t('common.action.retry')}</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>{data.name}</Text>
            <Text style={styles.subtitle}>{t(`place.type.${data.placeType}` as never)}</Text>

            {data.status === 'TEMPORARILY_CLOSED' && (
                <View style={styles.badge}>
                    <Text style={styles.badgeLabel}>{t('place.detail.temporarily_closed')}</Text>
                </View>
            )}

            {/* averageRating là null khi chưa có đánh giá — KHÔNG hiển thị 0 sao (FR-PLACE-12) */}
            <Text style={styles.body}>
                {data.averageRating == null
                    ? t('place.detail.no_rating')
                    : `★ ${data.averageRating} · ${data.reviewCount}`}
            </Text>

            {data.address && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('place.detail.address')}</Text>
                    <Text style={styles.body}>{data.address}</Text>
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('place.detail.opening_hours')}</Text>
                <Text style={styles.body}>
                    {data.isOpenNow == null
                        ? '—'
                        : data.isOpenNow
                          ? t('place.detail.open_now')
                          : t('place.detail.closed_now')}
                </Text>
            </View>

            <Text style={styles.hint}>
                {t('place.detail.visits_other', { count: data.visitCount })}
            </Text>

            {/* TODO(Phase 3): danh sách đánh giá, nút yêu thích, check-in, báo sai thông tin */}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, gap: 12 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    title: { fontSize: 24, fontWeight: '700' },
    subtitle: { fontSize: 14, opacity: 0.6 },
    section: { gap: 4, marginTop: 8 },
    sectionTitle: { fontSize: 15, fontWeight: '600', opacity: 0.8 },
    body: { fontSize: 15 },
    hint: { fontSize: 13, opacity: 0.6, marginTop: 8 },
    badge: {
        alignSelf: 'flex-start',
        backgroundColor: '#FFE8CC',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeLabel: { fontSize: 13, color: '#8A4B00', fontWeight: '600' },
    button: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, backgroundColor: '#208AEF' },
    buttonLabel: { color: '#fff', fontWeight: '600' },
});
