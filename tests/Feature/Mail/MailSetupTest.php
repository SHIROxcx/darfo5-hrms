<?php

use App\Mail\OtpMail;
use Illuminate\Support\Facades\Mail;

// Making real email work: the "mail:test" command that sends one test message and says in plain words what went wrong,
// and the MAIL_ALWAYS_TO safety that sends every email to one test inbox instead of the real people.

test('mail:test sends one message to the address and says which mailer it used', function () {
    config(['mail.default' => 'array']);

    $this->artisan('mail:test', ['address' => 'jomel@example.com'])
        ->expectsOutputToContain('array')
        ->expectsOutputToContain('Test email sent')
        ->assertSuccessful();

    $sent = Mail::mailer('array')->getSymfonyTransport()->messages();
    expect($sent)->toHaveCount(1)
        ->and($sent->first()->getEnvelope()->getRecipients()[0]->getAddress())->toBe('jomel@example.com')
        ->and($sent->first()->getOriginalMessage()->getSubject())->toContain('test email');
});

test('mail:test warns that the "log" mailer delivers nothing', function () {
    config(['mail.default' => 'log']);

    $this->artisan('mail:test', ['address' => 'jomel@example.com'])
        ->expectsOutputToContain('does not deliver')
        ->assertSuccessful();
});

test('mail:test refuses an address that is not an email address and sends nothing', function () {
    config(['mail.default' => 'array']);

    $this->artisan('mail:test', ['address' => 'not-an-email'])
        ->expectsOutputToContain('valid email address')
        ->assertFailed();

    expect(Mail::mailer('array')->getSymfonyTransport()->messages())->toHaveCount(0);
});

test('mail:test explains a connection that cannot be made, instead of a stack trace', function () {
    config([
        'mail.default' => 'smtp',
        'mail.mailers.smtp.host' => '127.0.0.1',
        'mail.mailers.smtp.port' => 1,
        'mail.mailers.smtp.username' => null,
        'mail.mailers.smtp.password' => null,
    ]);
    Mail::purge();

    $this->artisan('mail:test', ['address' => 'jomel@example.com'])
        ->expectsOutputToContain('Could not connect')
        ->assertFailed();
});

test('with MAIL_ALWAYS_TO set, every email goes to the test inbox and never to the real person', function () {
    config(['mail.default' => 'array', 'mail.to' => ['address' => 'inbox@test.local', 'name' => 'Test inbox']]);
    Mail::purge();

    Mail::to('real.person@example.com')->send(new OtpMail('123456', 'Maria'));

    $recipients = Mail::mailer('array')->getSymfonyTransport()->messages()->first()->getEnvelope()->getRecipients();
    expect(collect($recipients)->map->getAddress()->all())->toBe(['inbox@test.local']);
});

test('without MAIL_ALWAYS_TO, email goes to the real person', function () {
    config(['mail.default' => 'array', 'mail.to' => null]);
    Mail::purge();

    Mail::to('real.person@example.com')->send(new OtpMail('123456', 'Maria'));

    $recipients = Mail::mailer('array')->getSymfonyTransport()->messages()->first()->getEnvelope()->getRecipients();
    expect(collect($recipients)->map->getAddress()->all())->toBe(['real.person@example.com']);
});

test('MAIL_ALWAYS_TO is read from the environment by config/mail.php and is empty by default', function () {
    $mail = require config_path('mail.php');

    expect($mail)->toHaveKey('to')->and($mail['to'])->toBeNull();
});
