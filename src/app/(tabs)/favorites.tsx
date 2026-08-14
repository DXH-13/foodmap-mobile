import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useIsSignedIn } from '@/store/auth';

/**
 * Danh sách yêu thích.
 *
 * TODO(Phase 3): nối vào GET /api/v1/me/favorites.
 */
export default function FavoritesScreen() {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const isSignedIn = useIsSignedIn();

    if (!isSignedIn) {
        return (
            <View style={[styles.centered, { paddingTop: insets.top }]}>
                <Text style={styles.title}>{t('auth.guest.title')}</Text>
                <Text style={styles.body}>{t('auth.guest.message')}</Text>
                <Link href="/(auth)/login" asChild>
                    <Pressable style={styles.button}>
                        <Text style={styles.buttonLabel}>{t('auth.login.submit')}</Text>
                    </Pressable>
                </Link>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
            <Text style={styles.title}>{t('favorites.title')}</Text>
            <Text style={styles.body}>{t('favorites.empty')}</Text>
            <Text style={styles.hint}>{t('favorites.empty_hint')}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20, gap: 8 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
    title: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
    body: { fontSize: 15, opacity: 0.8, textAlign: 'center' },
    hint: { fontSize: 13, opacity: 0.6 },
    button: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, backgroundColor: '#208AEF' },
    buttonLabel: { color: '#fff', fontWeight: '600' },
});
