<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        

        // Build full name — fallback to email if all name fields are empty
        $fullName = $user ? trim(implode(' ', array_filter([
            $user->first_name,
            $user->last_name,
        ]))) : '';

        // Final fallback: use email if name is still empty
        if ($user && empty($fullName)) {
            $fullName = $user->email;
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user ? [
                    ...$user->toArray(),
                    'name'        => $fullName,    
                    'first_name'  => $user->first_name ?? '',
                    'last_name'   => $user->last_name ?? '',
                    'email'       => $user->email,
                    'roles'       => $user->getRoleNames()->values()->toArray(),
                    'permissions' => $user->getAllPermissions()->pluck('name')->values()->toArray(),
                    'avatar'      => $user->photo ? '/storage/' . $user->photo : null,
                ] : null,
            ],
            'unreadNotificationsCount' => function () use ($request) {
                $user = $request->user();
                if (! $user) return 0;

                $unreadNotifs = $user->unreadNotifications()->count();

                // Also count pending approvals for admins
                $pendingCount = 0;
                if ($user->hasRole('admin')) {
                    $pendingCount = \App\Models\User::role('employee')
                        ->where('is_approved', false)
                        ->whereNotNull('email_verified_at')
                        ->count();
                }

                return $unreadNotifs + $pendingCount;
            },
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
