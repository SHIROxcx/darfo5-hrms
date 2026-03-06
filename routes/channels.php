<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

/*
|--------------------------------------------------------------------------
| Only authenticated admins can subscribe to admin.notifications
|--------------------------------------------------------------------------
*/
Broadcast::channel('admin.notifications', function (User $user): bool {
    return $user->hasRole('admin');
});

/*
|--------------------------------------------------------------------------
| Users can only subscribe to their own private channel
|--------------------------------------------------------------------------
*/
Broadcast::channel('user.{id}', function (User $user, int $id): bool {
    return $user->id === $id;
});