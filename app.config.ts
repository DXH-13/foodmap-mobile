import type { ExpoConfig } from 'expo/config';

/**
 * Cấu hình Expo dạng TypeScript (thay cho app.json) để đọc được biến môi trường.
 *
 * ⚠️ Mọi biến `EXPO_PUBLIC_*` đều được nhúng vào bundle và ai cũng đọc được.
 * KHÔNG đặt secret ở đây.
 */

const config: ExpoConfig = {
    name: 'FoodMap',
    slug: 'foodmap',
    scheme: 'foodmap',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    // Nền cửa sổ gốc. Thiếu dòng này Android dùng nền đen, lộ ra ở vùng thanh điều hướng
    // bên dưới thanh tab nổi (thanh tab không chiếm chỗ trong layout).
    backgroundColor: '#F2F2F2',
    icon: './assets/images/icon.png',

    ios: {
        bundleIdentifier: 'vn.foodmap.app',
        supportsTablet: false,
        icon: './assets/expo.icon',
        infoPlist: {
            // Chuỗi giải thích quyền hiển thị cho người dùng — Apple từ chối app
            // nếu chuỗi chung chung hoặc thiếu.
            NSLocationWhenInUseUsageDescription:
                'FoodMap dùng vị trí của bạn để tìm quán ăn quanh đây và để xác nhận bạn đang ở gần quán khi ghi nhận đã đến.',
            NSPhotoLibraryUsageDescription:
                'FoodMap cần truy cập thư viện ảnh để bạn đính kèm ảnh và video vào đánh giá.',
            NSCameraUsageDescription:
                'FoodMap cần truy cập camera để bạn chụp ảnh món ăn khi viết đánh giá.',
        },
    },

    android: {
        package: 'vn.foodmap.app',
        adaptiveIcon: {
            backgroundColor: '#E6F4FE',
            foregroundImage: './assets/images/android-icon-foreground.png',
            backgroundImage: './assets/images/android-icon-background.png',
            monochromeImage: './assets/images/android-icon-monochrome.png',
        },
        predictiveBackGestureEnabled: false,
        permissions: [
            'ACCESS_COARSE_LOCATION',
            'ACCESS_FINE_LOCATION',
            'CAMERA',
            'READ_MEDIA_IMAGES',
            'READ_MEDIA_VIDEO',
        ],
    },

    // Trang quản trị chạy trên Next.js; bản web của app mobile chỉ để dev nhanh.
    // MapLibre KHÔNG chạy trên web — màn hình Bản đồ sẽ lỗi ở đó.
    web: {
        output: 'static',
        favicon: './assets/images/favicon.png',
    },

    plugins: [
        'expo-router',
        'expo-secure-store',
        'expo-video',
        '@maplibre/maplibre-react-native',
        [
            'expo-splash-screen',
            {
                backgroundColor: '#208AEF',
                image: './assets/images/splash-icon.png',
                imageWidth: 76,
            },
        ],
        [
            'expo-location',
            {
                locationAlwaysAndWhenInUsePermission:
                    'FoodMap dùng vị trí của bạn để tìm quán ăn quanh đây.',
            },
        ],
        [
            'expo-image-picker',
            {
                photosPermission:
                    'FoodMap cần truy cập thư viện ảnh để bạn đính kèm ảnh vào đánh giá.',
                cameraPermission:
                    'FoodMap cần truy cập camera để bạn chụp ảnh món ăn khi viết đánh giá.',
            },
        ],
    ],

    experiments: {
        typedRoutes: true,
        reactCompiler: true,
    },
};

export default config;
