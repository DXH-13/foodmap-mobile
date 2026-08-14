// i18next xuất `use`, `changeLanguage`, `language`… vừa là named export vừa là thuộc tính
// của instance mặc định. Quy tắc `import/no-named-as-default-member` cảnh báo mỗi lần
// truy cập chúng qua instance, nhưng ở đây đó chính là cách dùng đúng: named export chỉ
// là ảnh chụp tại thời điểm import, còn `i18n.language` mới là giá trị hiện tại.
/* eslint-disable import/no-named-as-default-member */
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import vi from './locales/vi.json';

export const SUPPORTED_LOCALES = ['vi', 'en'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'vi';

/** Ngôn ngữ hệ điều hành, thu về {vi, en}; ngoài hai cái đó thì dùng tiếng Việt. */
function detectDeviceLocale(): SupportedLocale {
    const deviceLanguage = getLocales()[0]?.languageCode;
    return SUPPORTED_LOCALES.includes(deviceLanguage as SupportedLocale)
        ? (deviceLanguage as SupportedLocale)
        : DEFAULT_LOCALE;
}

i18n.use(initReactI18next).init({
    resources: {
        vi: { translation: vi },
        en: { translation: en },
    },
    lng: detectDeviceLocale(),
    fallbackLng: DEFAULT_LOCALE,
    interpolation: {
        // React đã tự escape, i18next không cần làm lại
        escapeValue: false,
    },
    returnNull: false,
});

export function getCurrentLocale(): SupportedLocale {
    const current = i18n.language as SupportedLocale;
    return SUPPORTED_LOCALES.includes(current) ? current : DEFAULT_LOCALE;
}

export async function changeLocale(locale: SupportedLocale): Promise<void> {
    await i18n.changeLanguage(locale);
}

export default i18n;
