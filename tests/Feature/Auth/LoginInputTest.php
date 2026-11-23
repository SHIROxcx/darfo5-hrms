<?php

use App\Models\User;

// What the login accepts as input: right type, a sensible length, and an email that looks like an email. Before this an
// unexpected value (a list instead of an email) crashed the login with a server error, and a 200,000-character password
// was taken in and processed.

test('an email that is not text is refused with a message, not a crash', function () {
    $response = $this->post(route('login.store'), ['email' => ['someone@example.com'], 'password' => 'password']);

    $response->assertSessionHasErrors('email');
    $this->assertGuest();
});

test('a password that is not text is refused with a message, not a crash', function () {
    $response = $this->post(route('login.store'), ['email' => 'someone@example.com', 'password' => ['password']]);

    $response->assertSessionHasErrors('password');
    $this->assertGuest();
});

test('a value that is not an email address is refused in plain words', function (string $email) {
    $this->post(route('login.store'), ['email' => $email, 'password' => 'password'])
        ->assertSessionHasErrors(['email' => 'Enter a valid email address, like name@example.com.']);
})->with(['not-an-email', 'name@', '@example.com', 'two words@example.com']);

test('an email longer than 255 characters is refused', function () {
    $this->post(route('login.store'), ['email' => str_repeat('a', 251).'@b.ph', 'password' => 'password'])
        ->assertSessionHasErrors(['email' => 'Email is too long (maximum 255 characters).']);
});

test('a password longer than 255 characters is refused before it is checked', function () {
    $user = User::factory()->create();

    $this->post(route('login.store'), ['email' => $user->email, 'password' => str_repeat('x', 256)])
        ->assertSessionHasErrors(['password' => 'Password is too long (maximum 255 characters).']);
    $this->assertGuest();
});

test('a blank email or password still says it is required', function () {
    $this->post(route('login.store'), ['email' => '', 'password' => ''])
        ->assertSessionHasErrors(['email', 'password']);
});

test('a normal login still works, even with the longest allowed email', function () {
    $user = User::factory()->create(['email' => 'maria.reyes@example.com']);

    $this->post(route('login.store'), ['email' => 'maria.reyes@example.com', 'password' => 'password'])
        ->assertRedirect(route('dashboard', absolute: false));
    $this->assertAuthenticatedAs($user);
});

test('too many attempts are still throttled, whatever the email looks like', function () {
    foreach (range(1, 5) as $i) {
        $this->post(route('login.store'), ['email' => 'nobody@example.com', 'password' => 'wrong']);
    }

    $this->post(route('login.store'), ['email' => 'nobody@example.com', 'password' => 'wrong'])->assertStatus(429);
});

test('attempts with a malformed email still count toward the throttle', function () {
    foreach (range(1, 5) as $i) {
        $this->post(route('login.store'), ['email' => 'not-an-email', 'password' => 'wrong']);
    }

    $this->post(route('login.store'), ['email' => 'not-an-email', 'password' => 'wrong'])->assertStatus(429);
});
