import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

/** Nền dịu cho avatar chữ cái — chọn theo tên để mỗi người giữ một màu cố định. */
const TINTS = ['#F6C9BC', '#FFE0A3', '#C4EFC9', '#CFE0FF', '#E6D3F5', '#EED9C4'];

type Props = {
    name: string;
    url?: string | null;
    size?: number;
};

/** Avatar tròn: ảnh nếu có, không thì chữ cái đầu của tên. */
export function Avatar({ name, url, size = 28 }: Props) {
    const shape = { width: size, height: size, borderRadius: size / 2 };

    if (url) {
        return <Image source={url} style={shape} contentFit="cover" />;
    }

    let hash = 0;
    for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0;

    return (
        <View style={[styles.fallback, shape, { backgroundColor: TINTS[Math.abs(hash) % TINTS.length] }]}>
            <Text style={[styles.initial, { fontSize: size * 0.42 }]}>
                {name.trim().charAt(0).toUpperCase() || '?'}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    fallback: { alignItems: 'center', justifyContent: 'center' },
    initial: { fontWeight: '700', color: 'rgba(0,0,0,0.6)' },
});
