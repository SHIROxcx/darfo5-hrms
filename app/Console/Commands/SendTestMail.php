<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Throwable;

/**
 * Sends ONE test email with the current mail settings, so setting up real email (Gmail or any SMTP server) can be checked in
 * seconds, and says in plain words what went wrong when it fails. Sent at once, not queued, so a problem shows up here.
 */
class SendTestMail extends Command
{
    protected $signature = 'mail:test {address : The email address that should receive the test message}';

    protected $description = 'Send one test email with the current mail settings and explain in plain words what went wrong';

    public function handle(): int
    {
        $address = (string) $this->argument('address');

        if (! filter_var($address, FILTER_VALIDATE_EMAIL)) {
            $this->error("\"{$address}\" is not a valid email address.");

            return self::FAILURE;
        }

        $mailer = (string) config('mail.default');
        $settings = (array) config("mail.mailers.{$mailer}", []);
        $where = isset($settings['host']) ? " ({$settings['host']}:{$settings['port']})" : '';

        $this->line("Mailer: {$mailer}{$where}");
        $this->line('From:   '.config('mail.from.address'));

        $redirect = config('mail.to.address');
        if ($redirect) {
            $this->warn("MAIL_ALWAYS_TO is on: every email goes to {$redirect} instead of the real person, including this one.");
        }

        try {
            Mail::raw(
                "This is a test email from the DA RFO 5 HRIS.\n\nIf you can read this, sending email works.",
                fn ($message) => $message->to($address)->subject('DA RFO 5 HRIS: test email'),
            );
        } catch (Throwable $e) {
            return $this->explain($e, $settings);
        }

        if (in_array($mailer, ['log', 'array'], true)) {
            $this->warn("The \"{$mailer}\" mailer does not deliver real email: it only keeps the message (the \"log\" mailer writes it into storage/logs/laravel.log). Set MAIL_MAILER=smtp to send for real.");
        }

        $this->info('Test email sent'.($redirect ? " to {$redirect}" : " to {$address}").'. Check the inbox, and the spam folder.');

        return self::SUCCESS;
    }

    /** Say what a mail error most likely means. */
    private function explain(Throwable $e, array $settings): int
    {
        $text = Str::lower($e->getMessage());
        $host = $settings['host'] ?? 'the mail server';
        $port = $settings['port'] ?? '';

        if (Str::contains($text, ['connection could not be established', 'unable to connect', 'timed out', 'connection refused', 'getaddrinfo'])) {
            $this->error("Could not connect to {$host}".($port ? ":{$port}" : '').'.');
            $this->line('Check MAIL_HOST and MAIL_PORT, and that this computer can reach the internet. A firewall may be blocking the port (Gmail uses 587).');
        } elseif (Str::contains($text, ['535', 'username and password not accepted', 'authenticat', 'application-specific password'])) {
            $this->error("{$host} refused the username or password.");
            $this->line('For Gmail: turn on 2-Step Verification, create an App Password (16 letters) and use it as MAIL_PASSWORD, not your normal Google password. MAIL_USERNAME is the full Gmail address.');
        } elseif (Str::contains($text, ['starttls', 'tls', 'ssl'])) {
            $this->error('The secure connection (TLS) could not be set up.');
            $this->line('Port 587 normally needs MAIL_SCHEME=null (it upgrades to TLS by itself); port 465 needs MAIL_SCHEME=smtps.');
        } else {
            $this->error('The email could not be sent.');
        }

        $this->line('Details: '.Str::limit($e->getMessage(), 300));

        return self::FAILURE;
    }
}
