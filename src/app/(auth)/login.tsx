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
    const startSession = useStartSession();

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
            if (error) throw error;
            return data;
        },
        onSuccess: startSession,
    });

    const submit = handleSubmit((form) => login.mutate(form));

    const error = errors.email
        ? t('auth.login.invalid_email')
        : errors.password
          ? t('auth.login.invalid_password')
          : login.isError
            ? errorMessageOf(login.error, t('auth.login.failed'))
            : null;

    return (
        <AuthScaffold
            title={t('auth.login.title')}
            subtitle={t('auth.login.subtitle')}
            error={error}
            footer={
                <>
                    <Button title={t('auth.login.submit')} loading={login.isPending} onPress={submit} />
                    {/* replace, không push: qua lại giữa hai form không chồng stack. */}
                    <AuthLink label={t('auth.login.register_link')} onPress={() => router.replace('/(auth)/register')} />
                </>
            }>
            <FieldGroup>
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
                            autoComplete="current-password"
                            textContentType="password"
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
