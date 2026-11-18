---
name: notify-employee
description: Adds or changes a notification in DARFO5 HRMS — the in-app bell/drawer entry, the live Reverb push and, optionally, an email — using the project's Notification + broadcast Event pattern. Use when asked to notify an employee or admins about something (approval, denial, deadline, reminder), to send an email from the system, or when a notification doesn't arrive live or by email.
---

# notify-employee

A notification in this project has up to three parts. Decide which ones the event needs before writing code:

| Part | What the user sees | Built with |
|---|---|---|
| **Database entry** | A row in the notification drawer and the unread count on the bell | `Notification` class with `via()` → `'database'` and `toDatabase()` |
| **Live push** | The drawer and page update instantly, without a reload | A broadcast `Event` on a private Reverb channel |
| **Email** | A message in their inbox | `'mail'` in `via()` and `toMail()` |

Follow the existing pair `LeaveRequestReviewedNotification` + `LeaveRequestReviewed` (database + live push), and `AccountApprovedNotification` (database + email).

## 1. Decide

- **Who receives it?** One employee → `$user->notify(...)`. All admins → `Notification::send(User::role(['admin', 'superadmin'])->get(), ...)`.
- **Does it need email?** Use email for things people must act on or keep a record of: account approval, leave decisions, deadlines. Don't email admins for every submission; it floods inboxes. Ask the user if it's unclear.
- **Does a page need live data?** If an open page should update itself (a status badge, a credit bar, an admin table), the broadcast carries that data too.

## 2. Notification class

`app/Notifications/{Event}Notification.php`

- `toDatabase()` returns **exactly** `['message' => '...', 'url' => '/...']`. The drawer (`components/notification-drawer.tsx`) reads these two keys. The message is one plain sentence a person understands without context; the URL is the page where they act on it.
- **Queueing:**
  - Database + broadcast notifications are deliberately **not queued**. The row must exist before the browser gets the push, or the drawer's reload can race the queued write and drop the entry (see the comment in `LeaveRequestSubmittedNotification`). Keep new ones the same.
  - A notification that sends **email** implements `ShouldQueue` with `use Queueable`, so the request doesn't wait on SMTP. If one notification needs both instant database and queued email, split it into two classes, or queue only the mail channel with `viaQueues()`.
- `toMail()` uses `MailMessage` in the style of `AccountApprovedNotification`: subject, greeting with `$notifiable->first_name`, short lines, one `action()` button with an absolute `url(...)`, and the salutation `DA RFO 5 - HRIS`. No personal data beyond what the person needs (no government ID numbers, no salary).

## 3. Broadcast event (live push)

`app/Events/{Thing}{PastTenseVerb}.php`, implementing `ShouldBroadcastNow`.

- `broadcastOn()` returns private channels only:
  - `user.{id}` — that one employee
  - `admin.notifications` — all admins and superadmins
- `broadcastAs()` returns a kebab-case name (`leave-request-reviewed`). The frontend listens with a leading dot: `.listen('.leave-request-reviewed', ...)`.
- The payload is a public array property. Include `message` and `url` (the same text as the database entry) so the drawer can show it, plus only the fields the page needs to patch itself. Never broadcast whole models.
- Dispatch it **right after** the notification is sent, in the service that makes the change (e.g. `LeaveService::approveRequest`). If the change runs inside a DB transaction, dispatch after the commit.
- New channel? Add its rule to `routes/channels.php` and check who may listen (see `hrms-authz-check`).

## 4. Frontend listener

Listeners live in `resources/js/components/app-sidebar-header.tsx`, on `window.Echo.private('user.' + userId)` and `.private('admin.notifications')`. For a drawer entry, re-dispatch the push as a window event:

```ts
.listen('.thing-happened', (data: { message: string; url: string }) => {
    window.dispatchEvent(new CustomEvent('notif:new-notification', { detail: { message: data.message, url: data.url } }));
})
```

A page that patches itself (like `Employee/Leave/Index.tsx`) listens for its own event too. Add a TypeScript type for the payload in `resources/js/types/notification.tsx`.

## 5. Email setup

Email only arrives if the mailer is real. In `.env`, `MAIL_MAILER=log` writes emails into `storage/logs/laravel.log` instead of sending them. That is fine for local testing: open the log and look for the latest message.

For real delivery, the user must supply SMTP details. Never invent or guess them:
`MAIL_MAILER=smtp`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_SCHEME`, and a real `MAIL_FROM_ADDRESS` (the current `hello@example.com` will be rejected). Then `php artisan config:clear`.

A queue worker must be running for queued mail: `composer dev` starts one locally; in production, the `LaravelQueueWorker` service.

## 6. Tests

```php
Notification::fake();
Event::fake([ThingHappened::class]);
// ... perform the action ...
Notification::assertSentTo($employee, ThingHappenedNotification::class);
Event::assertDispatched(ThingHappened::class, fn ($e) => $e->userId === $employee->id);
```

Also assert that the wrong people are **not** notified (`assertNotSentTo`). For `toMail()`, render it and check the subject and the action URL.

## 7. If it doesn't arrive

| Symptom | Check |
|---|---|
| No drawer entry | `toDatabase()` keys are `message` and `url`; the `notifications` table has the row |
| Entry only after reload | Reverb running (port 8080); `REVERB_*` / `VITE_REVERB_*` keys set; the event name matches with the leading dot; the user is on the right channel |
| "You must pass your app key when you instantiate Pusher" | `VITE_REVERB_APP_KEY` is empty; run the `dev-doctor` skill |
| No email | `MAIL_MAILER` is `log`; queue worker not running; the `failed_jobs` table |

Drawer entries older than 30 days are deleted by `notifications:prune`, so don't use notifications as a permanent record. Use the database or an audit log for that.
