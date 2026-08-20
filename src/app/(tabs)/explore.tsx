import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Khám phá — tìm theo từ khoá và duyệt theo danh mục.
 *
 * TODO(Phase 2): nối vào GET /api/v1/places (tìm không dấu) và
 * GET /api/v1/categories. Xem docs/Management-Plan/lo-trinh-v1.md.
 */
export default function ExploreScreen() {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
            <Text style={styles.title}>{t('explore.title')}</Text>
            <Text style={styles.body}>{t('common.state.empty')}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20, gap: 8 },
    title: { fontSize: 24, fontWeight: '700' },
    body: { fontSize: 15, opacity: 0.7 },
});
