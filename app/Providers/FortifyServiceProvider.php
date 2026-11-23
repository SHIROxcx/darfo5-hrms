<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureActions();
        $this->configureViews();
        $this->configureRateLimiting();

        Fortify::redirects('register', '/verify-otp');

        Fortify::authenticateUsing(function (Request $request) {
            // Only text of a sensible length that looks like an email is looked up (and no long password is hashed).
            Validator::make($request->only('email', 'password'), [
                'email' => ['bail', 'required', 'string', 'max:255', 'email'],
                'password' => ['bail', 'required', 'string', 'max:255'],
            ], [
                'email.max' => 'Email is too long (maximum 255 characters).',
                'email.email' => 'Enter a valid email address, like name@example.com.',
                'password.max' => 'Password is too long (maximum 255 characters).',
            ])->validate();

            $user = User::where('email', $request->email)->first();

            if (! $user) {
                return null;
            }

            // Check password
            if (! \Illuminate\Support\Facades\Hash::check($request->password, $user->password)) {
                return null;
            }

            // If email not verified, log them in temporarily and redirect to verify
            if (! $user->hasVerifiedEmail()) {
                \Illuminate\Support\Facades\Auth::login($user);
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'email' => 'redirect_to_verify',
                ]);
            }

            // Admins and superadmins skip the approval check
            if ($user->hasRole(['superadmin', 'admin'])) {
                return $user;
            }

            // Employees must be approved
            if ($user->isRevoked()) {
                throw ValidationException::withMessages([
                    'email' => 'Your access has been revoked. Please contact the HR Administrator.',
                ]);
            }

            if (! $user->is_approved) {
                throw ValidationException::withMessages([
                    'email' => 'Your account is pending approval by the HR Administrator. You will receive an email once approved.',
                ]);
            }

            // Inactive employees (no longer working / retired) are blocked, even
            // if they were previously approved. A missing profile is NOT treated
            // as inactive — only an explicit is_active === false blocks login.
            if ($user->employeeProfile && ! $user->employeeProfile->is_active) {
                throw ValidationException::withMessages([
                    'email' => 'This account is inactive. Please contact the HR Administrator.',
                ]);
            }

            return $user;
        });
    }

    /**
     * Configure Fortify actions.
     */
    private function configureActions(): void
    {
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
        Fortify::createUsersUsing(CreateNewUser::class);
    }

    /**
     * Configure Fortify views.
     */
    private function configureViews(): void
    {
        Fortify::loginView(fn (Request $request) => Inertia::render('auth/login', [
            'canResetPassword' => Features::enabled(Features::resetPasswords()),
            'canRegister' => Features::enabled(Features::registration()),
            'status' => $request->session()->get('status'),
        ]));

        Fortify::resetPasswordView(fn (Request $request) => Inertia::render('auth/reset-password', [
            'email' => $request->email,
            'token' => $request->route('token'),
        ]));

        Fortify::requestPasswordResetLinkView(fn (Request $request) => Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::verifyEmailView(fn (Request $request) => Inertia::render('auth/verify-email', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::registerView(fn () => Inertia::render('auth/register'));

        Fortify::twoFactorChallengeView(fn () => Inertia::render('auth/two-factor-challenge'));

        Fortify::confirmPasswordView(fn () => Inertia::render('auth/confirm-password'));
    }

    /**
     * Configure rate limiting.
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('two-factor', function (Request $request) {
            return Limit::perMinute(5)->by($request->session()->get('login.id'));
        });

        RateLimiter::for('login', function (Request $request) {
            // The client can send anything here (a list, a huge string): only a reasonable piece of text goes in the key.
            $email = $request->input(Fortify::username());
            $throttleKey = Str::transliterate(Str::lower(is_string($email) ? mb_substr($email, 0, 255) : '').'|'.$request->ip());

            return Limit::perMinute(5)->by($throttleKey);
        });
    }
}
