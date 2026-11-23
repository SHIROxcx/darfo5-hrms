<?php

use App\Models\User;
use App\Support\Captcha;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

// The security-code ("captcha") check on login and account creation. It is self-hosted (no Google or other outside
// service), because the office server may have no internet access and a captcha that cannot load would lock everyone out.
// phpunit.xml switches it off for the rest of the suite; these tests switch it on.

beforeEach(function () {
    config(['captcha.enabled' => true]);
    foreach (['superadmin', 'admin', 'employee'] as $role) {
        Role::findOrCreate($role);
    }
});

/** What /captcha puts in the session for a known answer. */
function captchaSession(string $code = 'K7M2Q', ?int $expiresAt = null): array
{
    return ['captcha' => ['hash' => Captcha::hash($code), 'expires_at' => $expiresAt ?? now()->addMinutes(5)->timestamp]];
}

function loginUser(): User
{
    $user = User::factory()->create(['email' => 'maria@example.com', 'password' => bcrypt('Str0ng!Passw0rd#2026'), 'is_approved' => true, 'email_verified_at' => now()]);
    $user->assignRole('employee');

    return $user;
}

function loginInput(array $overrides = []): array
{
    return array_merge(['email' => 'maria@example.com', 'password' => 'Str0ng!Passw0rd#2026', 'captcha' => 'K7M2Q'], $overrides);
}

function signUpInput(array $overrides = []): array
{
    return array_merge([
        'first_name' => 'Maria', 'middle_name' => 'Reyes', 'last_name' => 'Dela Cruz', 'name_ext' => '',
        'email' => 'maria.new@example.com', 'mobile_number' => '09171234567',
        'agency' => 'DA RFO 5', 'division' => 'Operations Division', 'section_unit' => 'Agribusiness Section',
        'position' => 'Agriculturist I', 'salary_grade' => 11, 'employment_type' => 'permanent', 'employee_number' => '',
        'password' => 'Str0ng!Passw0rd#2026', 'password_confirmation' => 'Str0ng!Passw0rd#2026', 'captcha' => 'K7M2Q',
    ], $overrides);
}

// ---- the image ----

test('the captcha image is a PNG that is never cached, and it puts a fresh answer in the session', function () {
    $first = $this->get(route('captcha'))->assertOk();
    $hash = session('captcha.hash');

    expect($first->headers->get('Content-Type'))->toBe('image/png')
        ->and($first->headers->get('Cache-Control'))->toContain('no-store')
        ->and($first->headers->get('X-Content-Type-Options'))->toBe('nosniff');

    [$width, $height] = getimagesizefromstring($first->getContent());
    expect([$width, $height])->toBe([config('captcha.width'), config('captcha.height')]);

    $this->get(route('captcha'))->assertOk();
    expect(session('captcha.hash'))->not->toBe($hash);
});

test('the session keeps only a hash of the answer, never the letters, and the page never receives it', function () {
    $this->get(route('captcha'))->assertOk();

    expect(session('captcha.hash'))->toMatch('/^[a-f0-9]{64}$/')
        ->and(session('captcha.expires_at'))->toBeGreaterThan(now()->timestamp);
});

test('without the image library the answer is drawn as an SVG instead, so login is never locked out', function () {
    $drawn = Captcha::render('K7M2Q', forceSvg: true);

    expect($drawn['mime'])->toBe('image/svg+xml')
        ->and($drawn['body'])->toContain('<svg')->toContain('</svg>');
});

test('the image address is limited to 30 a minute and does not exist when the captcha is switched off', function () {
    foreach (range(1, 30) as $i) {
        $this->get(route('captcha'))->assertOk();
    }
    $this->get(route('captcha'))->assertStatus(429);

    $this->flushSession();
    config(['captcha.enabled' => false]);
    $this->app['cache']->flush();
    $this->get(route('captcha'))->assertNotFound();
});

// ---- the check itself ----

test('a right answer passes once, in any case and with spaces around it, and is then used up', function () {
    $this->withSession(captchaSession('K7M2Q'));

    expect(Captcha::check(' k7m2q '))->toBeTrue()
        ->and(Captcha::check('K7M2Q'))->toBeFalse();
});

test('a wrong answer fails and also uses up the image, so it cannot be guessed again', function () {
    $this->withSession(captchaSession('K7M2Q'));

    expect(Captcha::check('AAAAA'))->toBeFalse()
        ->and(Captcha::check('K7M2Q'))->toBeFalse();
});

test('an answer after the time limit, with no image asked for, or in the wrong shape fails', function () {
    $this->withSession(captchaSession('K7M2Q', now()->subMinute()->timestamp));
    expect(Captcha::check('K7M2Q'))->toBeFalse();

    $this->flushSession();
    expect(Captcha::check('K7M2Q'))->toBeFalse();

    foreach ([null, '', '   ', ['K7M2Q'], 12345] as $odd) {
        $this->withSession(captchaSession('K7M2Q'));
        expect(Captcha::check($odd))->toBeFalse();
    }
});

// ---- login ----

test('login needs the captcha: left empty or wrong it is refused in plain words and nobody is logged in', function () {
    loginUser();

    foreach ([null, '', 'WRONG'] as $answer) {
        $this->withSession(captchaSession())
            ->post(route('login.store'), loginInput(['captcha' => $answer]))
            ->assertSessionHasErrors('captcha');
        $this->assertGuest();
    }

    expect(session('errors')->first('captcha'))->toContain('security code');
});

test('login works with the right captcha and the right password', function () {
    loginUser();

    $this->withSession(captchaSession())->post(route('login.store'), loginInput())->assertSessionHasNoErrors();

    $this->assertAuthenticated();
});

test('the captcha is checked before the password, so a wrong password reveals nothing without it', function () {
    loginUser();

    $this->post(route('login.store'), loginInput(['password' => 'not the password', 'captcha' => '']))
        ->assertSessionHasErrors('captcha')
        ->assertSessionDoesntHaveErrors(['email', 'password']);
});

test('one captcha serves one login attempt: after a wrong password the same code is no good', function () {
    loginUser();

    $this->withSession(captchaSession())->post(route('login.store'), loginInput(['password' => 'not the password']))
        ->assertSessionHasErrors('email');

    $this->post(route('login.store'), loginInput())->assertSessionHasErrors('captcha');
    $this->assertGuest();
});

// ---- account creation ----

test('creating an account needs the captcha, and no account is made without it', function () {
    foreach ([null, '', 'WRONG'] as $answer) {
        $this->withSession(captchaSession())
            ->post(route('register.store'), signUpInput(['captcha' => $answer]))
            ->assertSessionHasErrors('captcha');
    }

    expect(User::where('email', 'maria.new@example.com')->exists())->toBeFalse();
});

test('creating an account works with the right captcha', function () {
    $this->withSession(captchaSession())->post(route('register.store'), signUpInput())->assertSessionHasNoErrors();

    expect(User::where('email', 'maria.new@example.com')->exists())->toBeTrue();
});

test('the captcha is checked first when creating an account, so "this email is registered" cannot be probed without it', function () {
    loginUser();

    $this->post(route('register.store'), signUpInput(['email' => 'maria@example.com', 'captcha' => '']))
        ->assertSessionHasErrors('captcha')
        ->assertSessionDoesntHaveErrors('email');
});

// ---- switched off, and what the pages are told ----

test('with the captcha switched off, login and sign-up work without it', function () {
    config(['captcha.enabled' => false]);
    loginUser();

    $this->post(route('login.store'), loginInput(['captcha' => '']))->assertSessionHasNoErrors();
    $this->assertAuthenticated();

    auth()->logout();
    $this->post(route('register.store'), signUpInput(['captcha' => '']))->assertSessionHasNoErrors();
});

test('the login and sign-up pages are told whether to show the captcha', function () {
    $this->get(route('login'))->assertInertia(fn (Assert $page) => $page->component('auth/login')->where('captchaEnabled', true)->etc());
    $this->get(route('register'))->assertInertia(fn (Assert $page) => $page->component('auth/register')->where('captchaEnabled', true)->etc());

    config(['captcha.enabled' => false]);
    $this->get(route('login'))->assertInertia(fn (Assert $page) => $page->where('captchaEnabled', false)->etc());
    $this->get(route('register'))->assertInertia(fn (Assert $page) => $page->where('captchaEnabled', false)->etc());
});
