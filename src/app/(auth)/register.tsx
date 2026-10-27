import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { api, errorMessageOf } from '@/api/client';
import { Button } from '@/components/button';
import { Field, FieldGroup } from '@/components/text-field';
import { AuthLink, AuthScaffold } from '@/features/auth/auth-scaffold';
import { useStartSession } from '@/features/auth/useStartSession';
import { getCurrentLocale } from '@/i18n';

/**
 * FR-AUTH-01: mật khẩu tối thiểu 8 ký tự, có ít nhất một chữ cái và một chữ số.
 * Chỉ để UX — backend luôn kiểm tra lại (trùng email trả 409 kèm thông báo đã dịch).
 */
const registerSchema = z.object({
    displayName: z.string().trim().min(1).max(50),
    email: z.string().email(),
    password: z
        .string()
        .min(8)
        .regex(/[A-Za-z]/)
        .regex(/\d/),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
    const { t } = useTranslation();
    const startSession = useStartSession();

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
        defaultValues: { displayName: '', email: '', password: '' },
    });

    // Hợp đồng: 201 trả về AuthTokens — đăng ký xong là có phiên luôn, không phải đăng nhập lại.
    const register = useMutation({
        mutationFn: async (form: RegisterForm) => {
            const { data, error } = await api.POST('/api/v1/auth/register', {
                body: { ...form, preferredLocale: getCurrentLocale() },
            });
            if (error) throw error;
            return data;
        },
        onSuccess: startSession,
    });

    const submit = handleSubmit((form) => register.mutate(form));

    const error = errors.displayName
        ? t('auth.register.invalid_display_name')
        : errors.email
          ? t('auth.login.invalid_email')
          : errors.password
            ? t('auth.register.password_rule')
            : register.isError
              ? errorMessageOf(register.error, t('auth.register.failed'))
              : null;

    return (
        <AuthScaffold
            title={t('auth.register.title')}
            subtitle={t('auth.register.subtitle')}
            error={error}
            footer={
                <>
                    <Button title={t('auth.register.submit')} loading={register.isPending} onPress={submit} />
                    <AuthLink label={t('auth.register.login_link')} onPress={() => router.replace('/(auth)/login')} />
                </>
            }>
            <FieldGroup>
                <Controller
                    control={control}
                    name="displayName"
                    render={({ field: { onChange, onBlur, value } }) => (
                        <Field
                            invalid={!!errors.displayName}
                            placeholder={t('auth.register.display_name')}
                            autoComplete="name"
                            textContentType="name"
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                        />
                    )}
                />
                <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                        <Field
                            invalid={!!errors.email}
                            placeholder={t('auth.login.email')}
                            autoCapitalize="none"
                            autoComplete="email"
                            keyboardType="email-address"
                            textContentType="emailAddress"
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
                        <Field
                            invalid={!!errors.password}
                            placeholder={t('auth.login.password')}
                            secureTextEntry
                            autoComplete="new-password"
                            textContentType="newPassword"
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            onSubmitEditing={submit}
                        />
                    )}
                />
            </FieldGroup>
        </AuthScaffold>
    );
}
