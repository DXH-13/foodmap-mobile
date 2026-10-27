import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { PlaceArt } from '@/components/place-art';
import { Palette, Radius, Space, Type } from '@/constants/theme';

/** Bốn loại địa điểm, xếp so le như một tấm collage — giới thiệu app không cần ảnh thật. */
const TILES = [
    { type: 'RESTAURANT', rotate: '-6deg', top: 0, left: 0 },
    { type: 'STREET_FOOD', rotate: '5deg', top: 18, left: 128 },
    { type: 'CAFE', rotate: '4deg', top: 128, left: 8 },
    { type: 'FOOD_MARKET', rotate: '-5deg', top: 146, left: 136 },
] as const;

/**
 * Màn đầu tiên khi chưa đăng nhập. Không vào thẳng app — người dùng chọn tạo tài khoản
 * hoặc đăng nhập; xong mới tới guide tour.
 */
export default function WelcomeScreen() {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + Space.lg }]}>
            <View style={styles.hero}>
                <View style={styles.collage}>
                    {TILES.map((tile) => (
                        <PlaceArt
                            key={tile.type}
                            placeType={tile.type}
                            radius={Radius.xl}
                            iconSize={40}
                            style={[
                                styles.tile,
                                { top: tile.top, left: tile.left, transform: [{ rotate: tile.rotate }] },
                            ]}
                        />
                    ))}
                </View>
            </View>

            <View style={styles.copy}>
                <Text style={styles.title}>{t('auth.welcome.title')}</Text>
                <Text style={styles.tagline}>{t('auth.welcome.tagline')}</Text>
            </View>

            <View style={styles.actions}>
                <Button title={t('auth.welcome.create_account')} onPress={() => router.push('/(auth)/register')} />
                <Button title={t('auth.login.submit')} variant="tinted" onPress={() => router.push('/(auth)/login')} />
            </View>
        </View>
    );
}

const TILE = 120;

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Palette.surface, paddingHorizontal: Space.xxl },
    hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    collage: { width: TILE * 2 + 16, height: TILE * 2 + 28 },
    tile: {
        position: 'absolute',
        width: TILE,
        height: TILE,
        borderWidth: 4,
        borderColor: Palette.card,
        boxShadow: '0 8px 24px rgba(159,64,45,0.18)',
    },
    copy: { gap: Space.sm, marginBottom: Space.xxxl },
    title: { ...Type.largeTitle, color: Palette.onSurface, textAlign: 'center' },
    tagline: { ...Type.body, color: Palette.textSecondary, textAlign: 'center' },
    actions: { gap: Space.md },
});
