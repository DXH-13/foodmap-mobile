import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { changeLocale, getCurrentLocale, SUPPORTED_LOCALES } from '@/i18n';
import { useAuthStore, useIsSignedIn } from '@/store/auth';

const LOCALE_LABELS: Record<string, string> = {
    vi: 'Tiếng Việt',
    en: 'English',
};

export default function ProfileScreen() {
    const { t, i18n } = useTranslation();
    const insets = useSafeAreaInsets();
    const isSignedIn = useIsSignedIn();
    const clearSession = useAuthStore((state) => state.clearSession);

    const current = getCurrentLocale();

    return (
        <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
            <Text style={styles.title}>{t('profile.title')}</Text>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('profile.language')}</Text>
                <View style={styles.chips}>
                    {SUPPORTED_LOCALES.map((locale) => (
                        <Pressable
                            key={locale}
                            style={[styles.chip, current === locale && styles.chipActive]}
                            onPress={() => void changeLocale(locale)}>
                            <Text style={current === locale ? styles.chipLabelActive : styles.chipLabel}>
                                {LOCALE_LABELS[locale]}
                            </Text>
                        </Pressable>
                    ))}
                </View>
                <Text style={styles.hint}>i18next: {i18n.language}</Text>
            </View>

            {isSignedIn ? (
                <Pressable style={styles.button} onPress={clearSession}>
                    <Text style={styles.buttonLabel}>{t('profile.logout')}</Text>
                </Pressable>
            ) : (
                <Link href="/(auth)/login" asChild>
                    <Pressable style={styles.button}>
                        <Text style={styles.buttonLabel}>{t('auth.login.submit')}</Text>
                    </Pressable>
                </Link>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20, gap: 20 },
    title: { fontSize: 24, fontWeight: '700' },
    section: { gap: 8 },
    sectionTitle: { fontSize: 15, fontWeight: '600', opacity: 0.8 },
    chips: { flexDirection: 'row', gap: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#ccc' },
    chipActive: { backgroundColor: '#208AEF', borderColor: '#208AEF' },
    chipLabel: { fontSize: 14 },
    chipLabelActive: { fontSize: 14, color: '#fff', fontWeight: '600' },
    hint: { fontSize: 12, opacity: 0.5 },
    button: {
        alignSelf: 'flex-start',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#208AEF',
    },
    buttonLabel: { color: '#fff', fontWeight: '600' },
});
