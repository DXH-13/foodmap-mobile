import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { z } from 'zod';

import { api, errorMessageOf } from '@/api/client';
import { useAuthStore } from '@/store/auth';

/**
 * Validation phía client chỉ để UX — backend luôn kiểm tra lại.
 * Ràng buộc mật khẩu ở đây khớp FR-AUTH-01.
 */
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
    const { t } = useTranslation();
    const setSession = useAuthStore((state) => state.setSession);

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });

    const login = useMutation({
        mutationFn: async (form: LoginForm) => {
            const { data, error } = await api.POST('/api/v1/auth/login', { body: form });
            if (error) {
                throw error;
            }
            return data;
        },
        onSuccess: async (tokens) => {
            await setSession(tokens.accessToken, tokens.refreshToken, tokens.user);
            // Quay lại đúng chỗ người dùng đang dở, không đẩy về màn hình chính.
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('/');
            }
        },
    });

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t('auth.login.title')}</Text>

            <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                        style={[styles.input, errors.email && styles.inputError]}
                        placeholder={t('auth.login.email')}
                        autoCapitalize="none"
                        autoComplete="email"
                        keyboardType="email-address"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                    />
                )}
            />

            <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                        style={[styles.input, errors.password && styles.inputError]}
                        placeholder={t('auth.login.password')}
                        secureTextEntry
                        autoComplete="current-password"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                    />
                )}
            />

            {login.isError && (
                <Text style={styles.error}>
                    {errorMessageOf(login.error, t('auth.login.failed'))}
                </Text>
            )}

            <Pressable
                style={[styles.button, login.isPending && styles.buttonDisabled]}
                disabled={login.isPending}
                onPress={handleSubmit((form) => login.mutate(form))}>
                {login.isPending ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonLabel}>{t('auth.login.submit')}</Text>
                )}
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 24, gap: 14, justifyContent: 'center' },
    title: { fontSize: 26, fontWeight: '700', marginBottom: 8 },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
    },
    inputError: { borderColor: '#d33' },
    error: { color: '#d33', fontSize: 14 },
    button: {
        backgroundColor: '#208AEF',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 6,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonLabel: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
