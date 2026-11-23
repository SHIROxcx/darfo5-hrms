# Sending real email with Gmail

The HRIS sends four kinds of email: the login/verification code (OTP), "your account was approved", announcements, and "new memo". Until this is set up they are only written into `storage/logs/laravel.log` (`MAIL_MAILER=log`).

## 1. Prepare the Google account
Use one Google account just for sending (for example an office account, not someone's personal one).
1. Google Account > **Security** > turn on **2-Step Verification**. Google only offers app passwords after this.
2. Open https://myaccount.google.com/apppasswords, name it `DA RFO 5 HRIS`, and click **Create**.
3. Copy the 16 letters Google shows (spaces do not matter). **This is the only time it is shown.** It is used instead of the normal password.

If the page does not offer app passwords: 2-Step Verification is off, the account is a Google Workspace account whose administrator has blocked them, or Advanced Protection is on. Ask the administrator, or use a different account.

## 2. Put the settings in `.env`
On the **live server** (never commit this file; `.env` is ignored by git):
```
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SCHEME=null
MAIL_USERNAME=the.sending.address@gmail.com
MAIL_PASSWORD=abcdefghijklmnop
MAIL_FROM_ADDRESS=the.sending.address@gmail.com
MAIL_FROM_NAME="DA RFO 5 HRIS"
MAIL_ALWAYS_TO=
```
- `MAIL_USERNAME` is the full Gmail address, `MAIL_PASSWORD` the app password.
- `MAIL_FROM_ADDRESS` must be that same Gmail address. Gmail replaces any other "from" address with it.
- `MAIL_SCHEME=null` is right for port 587 (it upgrades to a secure connection by itself). For port 465 use `MAIL_SCHEME=smtps`.

On a **development computer whose database holds real employees**, also set `MAIL_ALWAYS_TO=your.own@address`. Every email then goes to that one inbox, so testing never reaches the real people.

## 3. Make the app read the new settings
- Development (`composer dev`): run `php artisan config:clear`. The queue worker picks the settings up by itself.
- Live server: `php artisan config:clear` (then `php artisan optimize` if you cache config), and restart the queue worker service: `Restart-Service LaravelQueueWorker`. It keeps the old settings until it is restarted.

## 4. Test it
```
php artisan mail:test your.own@address
```
It sends one message and says what went wrong in plain words. Check the inbox and the spam folder.

| What it says | What to do |
|---|---|
| Could not connect to smtp.gmail.com:587 | The computer cannot reach Gmail. Check the internet and that a firewall allows outgoing port 587. |
| refused the username or password | `MAIL_PASSWORD` must be the 16-letter app password, and `MAIL_USERNAME` the full address. |
| The secure connection (TLS) could not be set up | Port 587 needs `MAIL_SCHEME=null`; port 465 needs `MAIL_SCHEME=smtps`. |
| "Test email sent" but nothing arrives | Look in spam. If `MAIL_ALWAYS_TO` is set, the message went to that address instead. |
| "does not deliver real email" | `MAIL_MAILER` is still `log` (or `array`). Set it to `smtp`. |

Login codes, approvals, announcements and memo emails are **queued**: they are only sent while the queue worker runs (`composer dev` on a development computer, the `LaravelQueueWorker` service on the server).

## Things to know
- A normal Gmail account can send to about 500 recipients a day (a Workspace account about 2,000). An announcement or memo to every employee counts one per person. For a large office, ask for a Workspace account or the office's own mail server.
- Google may block the first sign-in from a new server and send a "blocked sign-in" notice to that account. Open it and confirm it was you.
- The password you create here gives access to sending mail only. If it leaks, delete it on the same Google page and create a new one.
