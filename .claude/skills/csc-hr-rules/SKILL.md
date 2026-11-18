---
name: csc-hr-rules
description: The HR and Civil Service Commission (CSC) rules DARFO5 HRMS follows — leave types, leave credits, who may file what, CSC Form 6, and the open policy questions for accrual, carry-over, monetization and SPMS. Use before writing or changing any leave, credit, attendance or performance logic, and when asked what an HR rule is. It separates rules already confirmed and built from rules still waiting on HR.
---

# csc-hr-rules

HR rules decide people's pay and leave, so **never invent or assume a rule**. This skill has two lists:

- **Confirmed:** rules the system already implements. Follow them as written.
- **Pending HR:** rules that are not decided yet. Don't implement them. Stop and tell the user the decision is needed, and point them to `hr-policy-questions.md` in the project root.

When HR answers a question, move the rule from Pending to Confirmed here, with the date and who confirmed it, then build it.

General CSC rules (for example from the Omnibus Rules on Leave) are a starting point for questions, not a final answer: agencies apply them with their own details, and circulars change. Cite the source the user gives you.

## Confirmed (implemented in the code)

### Who may file what
| Employment type | May file | Where |
|---|---|---|
| Permanent | Every active leave type; CSC Form 6 (`form_type = csc6`) and the Wellness Leave modal | `LeaveService::canFileCscForm` |
| JO, COS, Pakyaw | Wellness Leave only, through the simple modal (`form_type = simple`). Basis given in the code: CSC MC 41 s.1998. | `LeaveService::restrictedToWellnessOnly` |
| Missing or unknown type | Nothing on CSC Form 6 (denied by default) | same |

Employment type is matched case-insensitively (`employee_profiles.employment_type` is free text).

### Leave types with balances
| Code | Name | Credits per year (current default) | Notes |
|---|---|---|---|
| VL | Vacation Leave | 15 | Tracks credits |
| SL | Sick Leave | 15 | Tracks credits |
| WL | Wellness Leave | 5 | Tracks credits. Max **3 consecutive days**. Has holiday-adjacency rules in `LeaveService`. Not on CSC Form 6. |
| FL | Mandatory/Forced Leave | none of its own | Charged against **VL** (`charge_to_leave_type_id`) |
| PL | Privilege Leave | — | **Retired**, inactive; kept only so old records resolve |

All other CSC Form 6 types — ML, PAT, SPL, SOLO, STUDY, VAWC, RL, SLW, CL, AL, OTH — can be filed but **track no balance** (`tracks_credits = false`). The order of the checkboxes on CSC Form 6 section 6.A comes from `leave_types.csc_form_order`.

### Counting and approval
- Leave days are working days: Monday to Friday, minus holidays managed in Admin → Holidays (`LeaveService::countWorkingDays`).
- Filing creates **pending** credits; approval moves them to **used**; denial or cancellation releases them.
- On approval of CSC Form 6, only **7.C "days with pay"** is deducted (`LeaveService::chargedDays`).
- A CSC Form 6 can't be approved without section 7 (7.A–7.D). 7.A is pre-filled by `LeaveService::certificationFor()`.
- CSC Form 6 start date may not be before today, in **Asia/Manila** time (`config/leave.php` timezone).
- Items 1–5 of CSC Form 6 are frozen at filing in `applicant_snapshot`. Salary comes from the latest service record, falling back to the salary grade.
- Signatory names and titles come from `config/leave.php` (`LEAVE_*` env keys).

## Pending HR (do not implement yet)

Each item matches a numbered question in `hr-policy-questions.md`.

**Leave credits**
1. Monthly accrual: whether VL and SL are earned monthly (CSC practice is 1.25 days each per month of service), or granted yearly as now (15 each on 1 January).
2. Partial months: credits for employees hired, separated, or on leave without pay mid-month.
3. Carry-over: whether unused VL and SL carry into the next year, and any cap.
4. Year reset: what happens to unused WL at year end.
5. Forced Leave: the yearly 5-day rule, and what happens when it isn't used.
6. Tardiness and undertime: whether they are deducted from VL, and how minutes convert to days.
7. Leave without pay: when a request exceeds the balance.
8. Leave crossing two years: which year's balance is charged. (Today the whole request is charged to the start date's year.)
9. Starting balances: how existing employees' current balances are loaded into the system.

**Other leave types** (currently no balance)
10. For each of ML, PAT, SPL, SOLO, STUDY, VAWC, RL, SLW, CL, AL: the allowance per year or per event, eligibility, and required documents (e.g. medical certificate for SL over 5 days).
11. Monetization and terminal leave: whether the system computes them.

**Rules and process**
12. Cancelling approved leave: whether leave already taken may be cancelled, and whether credits are restored. (Today it can be, with credits restored.)
13. Filing deadlines: how far in advance VL must be filed; how soon after return SL must be filed.
14. Approval chain: whether 7.A, 7.B and 7.C/7.D stay with one admin or are split among officials.

**Other modules**
15. Attendance/DTR: data source (biometric device, manual entry), office hours, flexi-time, grace period.
16. SPMS (IPCR/OPCR): rating periods, rating scale, who rates and approves.

## How to apply

- Code that needs a confirmed rule: follow it and cite where it lives in the code.
- Code that needs a pending rule: don't build a guess behind a flag or default. Tell the user which question number blocks it.
- Code that changes a confirmed rule: say so plainly and get the user's agreement; update this file in the same change.
- Keep rule values (credits, limits, day counts) in the database (`leave_types`) or `config/leave.php`, not hardcoded, so HR changes don't need a code release.
