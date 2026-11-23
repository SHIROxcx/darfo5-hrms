# How to Use the Claude Skills

This guide shows how to use this project's Claude Code skills when you develop or add modules. For the list of skills and what each one covers, see [skills.md](skills.md).

## How skills are triggered

Ask Claude in plain language. Each skill's description tells Claude when it applies, so it loads on its own.

To make sure a skill runs, name it ("use the admin-module skill") or type its slash command (`/admin-module`).

The skills live in `.claude/skills/<skill-name>/SKILL.md`.

## 1. Starting your day

> "start the project"

`dev-doctor` checks `.env` (app key, MySQL, Reverb keys), checks that MySQL is running, then runs `composer dev`. It also runs when you paste a startup error, such as:

- `MissingAppKeyException`
- `Database file at path [...database.sqlite] does not exist`
- `ViteManifestNotFoundException`
- "You must pass your app key when you instantiate Pusher"

## 2. Adding a new module

The example here is a Trainings module.

### Step 1: Fill in a module spec (recommended)

For anything bigger than a simple list, write the module down first:

1. Copy [docs/modules/_template.md](docs/modules/_template.md) to `docs/modules/<module-name>.md`, e.g. `docs/modules/trainings.md`.
2. Fill in what you know: purpose, who may do what, fields, screens, workflow, rules, notifications, forms and reports, privacy, and the "done when" checks. Leave blanks or write `?` where you're unsure.
3. Tell Claude:

> "Build the module in docs/modules/trainings.md"

Claude treats the spec as the requirements, asks only about the blanks, and writes your answers back into the spec. The spec stays in the repo as the record of what was agreed. HR or other offices can fill in the purpose, rules and forms sections, even without touching code.

For a quick module, you can skip the spec and just ask:

> "Add a Trainings module where HR records trainings each employee attended: title, date, hours, sponsor, and a certificate upload."

The more you say up front (fields, who uses it, what it shows), the fewer questions Claude asks.

### Step 2: Answer the scoping questions

`admin-module` asks only what your request left open, for example:

- Can employees see their own trainings?
- Should superadmins also manage them?
- Can a training be deleted if it's linked to a PDS entry?

Claude then shows the list of files it will create. **Read it before saying go.** It's the cheapest point to correct the design.

### Step 3: Claude builds it

The other skills join in on their own:

| While building… | Skill | What it makes sure of |
|---|---|---|
| Choosing file locations and names | `architecture-guard` | Controller in `Admin/Trainings/`, page at `pages/Admin/Trainings/Index.tsx` |
| Adding each route | `hrms-authz-check` | The right `role:` group, and employees can't open other employees' records |
| Building the page | `ui-consistency` | The page looks and behaves like the existing pages |
| Storing certificates | `hrms-authz-check` | Private disk and an ownership check on download |

### Step 4: Check the result

Claude ends with the files created, the routes and their middleware, and the test results. Then:

1. Open the page in the running app and try it yourself.
2. Run `/code-review` for a bug check of the changes.
3. Commit when you're happy.

## 3. When a module needs more

| You say… | Skill that runs | Notes |
|---|---|---|
| "Add a printable Certificate of Training" | `official-form-pdf` | Have the official form ready; it asks for it. |
| "Notify the employee when HR adds a training" | `notify-employee` | Decides between drawer entry, live push and email. |
| "Deduct tardiness from VL" | `csc-hr-rules` | Stops and points to question 6 in [hr-policy-questions.md](hr-policy-questions.md), because HR hasn't decided yet. |

## 4. Before deploying

> "run a security audit"

`security-hardening`:
- maps every route
- probes your **local** copy as employee A, employee B and an admin
- checks the configuration and dependencies
- gives you a findings table, ranked by severity

It fixes nothing until you approve. It never probes the live server.

## 5. Once modules are stable

> "clean up unused code"

`dead-code-cleanup`:
- works on a `cleanup/` branch, never on `main`
- shows a table of unused items with the evidence for each
- deletes only what you pick
- runs the tests after each batch

## 6. When HR answers the policy questions

> "HR answered questions 1–4 in hr-policy-questions.md: …"

Claude moves those rules from "Pending HR" to "Confirmed" in `csc-hr-rules`, with the date and who confirmed them. Only then can those rules be built.

## Tips

- **Be specific in your first message.** It saves a round of questions.
- **Name a skill** if Claude doesn't pick it up: "use hrms-authz-check on the new routes."
- **Skills are editable.** If Claude keeps doing something you don't want, ask it to update the skill so the fix sticks. Example: "add to architecture-guard: modals go in a `modals/` folder."
- **Start small.** For your first try, ask for a small reference-data module, such as a list of training sponsors. It's low risk and uses `admin-module`, `architecture-guard` and `hrms-authz-check` together, so you see the whole flow.

## Quick reference

| When | Say | Skill |
|---|---|---|
| Start of day, or a startup error | "start the project" | `dev-doctor` |
| Plan a new feature | copy `docs/modules/_template.md` and fill it in | — |
| New feature | "build the module in docs/modules/….md" or "add a … module" | `admin-module` (+ `architecture-guard`, `hrms-authz-check`, `ui-consistency`) |
| New printable form | "add a printable …" | `official-form-pdf` |
| New notification or email | "notify … when …" | `notify-employee` |
| Leave, attendance or performance rules | (runs on its own) | `csc-hr-rules` |
| Review changes | `/code-review`, `/security-review` | built-in |
| Before deployment | "run a security audit" | `security-hardening` |
| Tidy up | "clean up unused code" | `dead-code-cleanup` |
