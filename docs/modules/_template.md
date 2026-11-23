# Module Spec: <Module name>

> **How to use this form**
> 1. Copy this file to `docs/modules/<module-name>.md` (e.g. `docs/modules/trainings.md`).
> 2. Fill in what you know. Leave a field blank or write `?` if you're unsure; Claude asks about those only.
> 3. Delete sections marked *(optional)* that don't apply.
> 4. Tell Claude: "Build the module in `docs/modules/<module-name>.md`."

| Requested by | Office / Position | Date | Status |
|---|---|---|---|
| Sir Joel | ICT/Programmmer | Head | Draft / Ready to build / Built |

---

## 1. Purpose

**What problem does this module solve?** (One or two sentences.)

Updating the PDS form from 2025 to 2026


**Who asked for it, and what do they do today without it?** (e.g. "HR tracks trainings in an Excel file.")

Sir Joel ask about it and supposedly we will be the one that we will use and we i think we will be 


**Legal or CSC basis, if any:** (circular, memo, form number)

n/a

## 2. Users and access

Tick who may do each action.

| Action | Superadmin | Admin (HR) | Employee (own records only) | Public (no login) |
|---|---|---|---|---|
| View the list | / | / |/ |/ |
| View one record |/|/ |/| ☐ |
| Create | ☐ | ☐ |/| ☐ |
| Edit | ☐ | ☐ |/| ☐ |
| Delete | ☐ | ☐ | /| ☐ |
| Approve / deny | /| /| /| ☐ |
| Export / print | /| /| /| ☐ |

**Which employment types does it apply to?** ☐ Permanent ☐ JO ☐ COS ☐ Pakyaw / All

**Where should it appear in the sidebar?** (e.g. "Admin → Trainings", "Settings → Reference Data")
/pds and in admin and also super admin when viewing records

## 3. Data

**What is one record?** (e.g. "one training an employee attended")

**Does each record belong to an employee?** / Yes ☐ No

**Fields:**

| Field | Type | Required? | Unique? | Example | Notes / allowed values |
|---|---|---|---|---|---|
| | text / number / date / yes-no / choice / file | ☐ | ☐ | | |
| | | ☐ | ☐ | | |
| | | ☐ | ☐ | | |

Types: **text** (short), **long text**, **number**, **money**, **date**, **date & time**, **yes/no**, **choice** (list the options), **link to** (another table: employee, division, position…), **file** (say which file types and max size).

**Links to existing data:** (e.g. employee, division, section, position, leave type)

**How many records over time?** ☐ Under 100 ☐ Hundreds ☐ Thousands or more

**Starting data:** ☐ None ☐ HR will encode ☐ Import from Excel/CSV (attach a sample) ☐ Seed a fixed list

**When an employee is deleted, their records should be:** ☐ Deleted too ☐ Kept ☐ Block the delete

**Can a record be deleted while in use elsewhere?** ☐ Yes ☐ No, block it ☐ N/A

## 4. Screens

**Kind of module:**
☐ **Simple list**: add, edit and delete in one table (like Positions or Holidays)
☐ **Full feature**: its own pages, filters, workflow

**List screen:** which columns, filters and search?

| Columns shown | Filters | Search by | Default sort |
|---|---|---|---|
| | | | |

**Other screens needed:** ☐ Detail view ☐ Create/edit form ☐ Review/approval ☐ Employee's own view ☐ Dashboard card

**Page to follow as a model:** (an existing page this should look like, e.g. "Admin → Leave Management")

**Attach a sketch, screenshot or the paper form if you have one.**

## 5. Workflow *(optional)*

**Does a record go through statuses?** (e.g. Draft → Submitted → Approved / Denied)

| Status | Who moves it here | What happens (credits, notifications, PDF…) |
|---|---|---|
| | | |

**Can an approved record be changed or cancelled? By whom?**

## 6. Business rules *(optional)*

List every calculation or limit. Give the source (CSC circular, office memo) for each.

| Rule | Source | Confirmed by HR? |
|---|---|---|
| | | ☐ |

> Rules not yet confirmed by HR are not built. See `hr-policy-questions.md`.

## 7. Notifications *(optional)*

| When | Who is told | In-app | Email |
|---|---|---|---|
| | | ☐ | ☐ |

## 8. Printable forms and reports *(optional)*

**Official forms to generate:** (name, form number, revision; attach the blank form)

| Form | Paper size | Who may print | Saved permanently once approved? |
|---|---|---|---|
| | A4 / Legal / Letter | | ☐ |

**Reports or exports:**

| Report | Filters | Format |
|---|---|---|
| | | Excel / CSV / PDF |

## 9. Privacy and security

**Does it hold sensitive data?** ☐ Government ID numbers ☐ Salary ☐ Health/medical ☐ Family details ☐ Signatures ☐ Uploaded personal documents ☐ None

**Who must never see it?**

**Should changes be logged (who changed what, when)?** ☐ Yes ☐ No

## 10. Done when

The module is finished when these all work. Write them as checks someone can try.

- [ ] (e.g. HR can add a training for an employee and see it in that employee's profile)
- [ ] (e.g. an employee sees only their own trainings)
- [ ] (e.g. HR can export all trainings for a date range to Excel)

## 11. Out of scope *(optional)*

What this module will **not** do in this version:

-

## 12. Open questions

Anything still undecided, and who will decide it:

| Question | Who decides | Answer |
|---|---|---|
| | | |
