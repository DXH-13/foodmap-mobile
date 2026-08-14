import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * Bản web của `useColorScheme`.
 *
 * Static rendering dựng HTML trên máy chủ, nơi không có `window.matchMedia`, nên
 * lần render đầu ở client phải khớp với máy chủ rồi mới được đọc giá trị thật —
 * nếu không sẽ lỗi hydration mismatch.
 *
 * Dùng `useSyncExternalStore` thay vì `useState` + `useEffect`: React chính thức
 * hỗ trợ cách này cho giá trị khác nhau giữa server và client, và tránh cảnh báo
 * `react-hooks/set-state-in-effect` (gọi setState ngay trong effect gây render dây chuyền).
 */
export function useColorScheme() {
    const hasHydrated = useSyncExternalStore(
        subscribeNoop,
        () => true, // trên client: đã hydrate
        () => false, // trên server: chưa
    );

    const colorScheme = useRNColorScheme();

    return hasHydrated ? colorScheme : 'light';
}

/** Giá trị không bao giờ đổi sau lần hydrate đầu tiên nên không cần đăng ký lắng nghe. */
function subscribeNoop() {
    return () => {};
}
