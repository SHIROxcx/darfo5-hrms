import { Transition } from '@headlessui/react';
import { Form, Head } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { Check, Eye, EyeOff } from 'lucide-react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import type { BreadcrumbItem } from '@/types';
import PasswordController from '@/actions/App/Http/Controllers/Settings/PasswordController';
import { edit } from '@/routes/user-password';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Password settings', href: edit().url },
];

const PASSWORD_CHECKS = [
    { label: 'At least 8 characters',      test: (p: string) => p.length >= 8 },
    { label: 'At least 1 uppercase letter',  test: (p: string) => /[A-Z]/.test(p) },
    { label: 'At least 1 lowercase letter',  test: (p: string) => /[a-z]/.test(p) },
    { label: 'At least 1 number',            test: (p: string) => /[0-9]/.test(p) },
    { label: 'At least 1 special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function PasswordChecklist({ password }: { password: string }) {
    if (!password) return null;

    const checks = PASSWORD_CHECKS.map(c => ({ ...c, pass: c.test(password) }));
    const allPassed = checks.every(c => c.pass);

    return (
        <div className="mt-2 p-3 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg space-y-1.5">
            {checks.map(({ label, pass }) => (
                <div key={label}
                    className={`flex items-center gap-2 text-xs transition-colors duration-200
                        ${pass ? 'text-green-600' : 'text-gray-400 dark:text-neutral-500'}`}>
                    <span className={`flex items-center justify-center w-4 h-4 rounded-full shrink-0 border transition-all duration-200
                        ${pass ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 dark:border-neutral-600'}`}>
                        {pass && <Check className="h-2.5 w-2.5" />}
                    </span>
                    {label}
                </div>
            ))}
            {allPassed && (
                <p className="text-xs font-semibold text-green-600 pt-0.5">✓ Strong password</p>
            )}
        </div>
    );
}
 
function PasswordField({
    id, name, label, placeholder, autoComplete, inputRef, error, onChange,
}: {
    id: string;
    name: string;
    label: string;
    placeholder: string;
    autoComplete: string;
    inputRef?: React.Ref<HTMLInputElement>;
    error?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
    const [show, setShow] = useState(false);

    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            <div className="relative mt-1">
                <Input
                    id={id}
                    ref={inputRef}
                    name={name}
                    type={show ? 'text' : 'password'}
                    className="block w-full pr-10"
                    autoComplete={autoComplete}
                    placeholder={placeholder}
                    onChange={onChange}
                />
                <button
                    type="button"
                    onClick={() => setShow(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300 transition-colors"
                    tabIndex={-1}
                    aria-label={show ? 'Hide password' : 'Show password'}
                >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </div>
            <InputError message={error} />
        </div>
    );
}

export default function Password() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);
    const [newPassword, setNewPassword] = useState('');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Password settings" />
            <h1 className="sr-only">Password Settings</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Update password"
                        description="Ensure your account is using a long, random password to stay secure"
                    />

                    <Form
                        {...PasswordController.update.form()}
                        options={{ preserveScroll: true }}
                        resetOnError={['password', 'password_confirmation', 'current_password']}
                        resetOnSuccess
                        onError={(errors) => {
                            if (errors.password) passwordInput.current?.focus();
                            if (errors.current_password) currentPasswordInput.current?.focus();
                        }}
                        onSuccess={() => setNewPassword('')}
                        className="space-y-6"
                    >
                        {({ errors, processing, recentlySuccessful }) => (
                            <>
                                <PasswordField
                                    id="current_password"
                                    name="current_password"
                                    label="Current password"
                                    placeholder="Current password"
                                    autoComplete="current-password"
                                    inputRef={currentPasswordInput}
                                    error={errors.current_password}
                                />

                                <div className="grid gap-2">
                                    <PasswordField
                                        id="password"
                                        name="password"
                                        label="New password"
                                        placeholder="New password"
                                        autoComplete="new-password"
                                        inputRef={passwordInput}
                                        error={errors.password}
                                        onChange={e => setNewPassword(e.target.value)}
                                    />
                                    <PasswordChecklist password={newPassword} />
                                </div>

                                <PasswordField
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    label="Confirm password"
                                    placeholder="Confirm password"
                                    autoComplete="new-password"
                                    error={errors.password_confirmation}
                                />

                                <div className="flex items-center gap-4">
                                    <button className='text-sm bg-green-600 rounded-xl px-3 py-2 text-white cursor-pointer hover:bg-green-700 font-semibold' disabled={processing} data-test="update-password-button">
                                        Save password
                                    </button>
                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-neutral-600">Saved</p>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </Form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}