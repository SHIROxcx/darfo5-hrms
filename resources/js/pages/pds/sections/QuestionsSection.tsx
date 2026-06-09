import { useState } from 'react';
import { Save } from 'lucide-react';
import type { User, PdsData, PdsQuestion, PdsSaveCallback } from '@/types/pds';
import { Spinner } from '@/components/ui/spinner';

interface Props { user: User; pdsData: PdsData; onSave: PdsSaveCallback; saving: boolean; }

// Every boolean question key that must be answered
const BOOLEAN_QUESTIONS: Array<{ key: keyof PdsQuestion; label: string }> = [
    { key: 'q34_a', label: 'Question 34a' },
    { key: 'q34_b', label: 'Question 34b' },
    { key: 'q35_a', label: 'Question 35a' },
    { key: 'q35_b', label: 'Question 35b' },
    { key: 'q36',   label: 'Question 36'  },
    { key: 'q37',   label: 'Question 37'  },
    { key: 'q38_a', label: 'Question 38a' },
    { key: 'q38_b', label: 'Question 38b' },
    { key: 'q39',   label: 'Question 39'  },
    { key: 'q40_a', label: 'Question 40a' },
    { key: 'q40_b', label: 'Question 40b' },
    { key: 'q40_c', label: 'Question 40c' },
];

// Detail fields that become required when the parent answer is YES
const CONDITIONAL_DETAILS: Array<{
    parentKey: keyof PdsQuestion;
    detailKey: keyof PdsQuestion;
    label: string;
}> = [
    { parentKey: 'q34_a', detailKey: 'q34_details',    label: 'Q34 details' },
    { parentKey: 'q34_b', detailKey: 'q34_details',    label: 'Q34 details' },
    { parentKey: 'q35_a', detailKey: 'q35_a_details',  label: 'Q35a details' },
    { parentKey: 'q35_b', detailKey: 'q35_b_date',     label: 'Q35b date filed' },
    { parentKey: 'q35_b', detailKey: 'q35_b_status',   label: 'Q35b case status' },
    { parentKey: 'q36',   detailKey: 'q36_details',    label: 'Q36 details' },
    { parentKey: 'q37',   detailKey: 'q37_details',    label: 'Q37 details' },
    { parentKey: 'q38_a', detailKey: 'q38_a_details',  label: 'Q38a details' },
    { parentKey: 'q38_b', detailKey: 'q38_b_details',  label: 'Q38b details' },
    { parentKey: 'q39',   detailKey: 'q39_details',    label: 'Q39 details' },
    { parentKey: 'q40_a', detailKey: 'q40_a_details',  label: 'Q40a details' },
    { parentKey: 'q40_b', detailKey: 'q40_b_details',  label: 'Q40b details' },
    { parentKey: 'q40_c', detailKey: 'q40_c_details',  label: 'Q40c details' },
];

type FormErrors = Partial<Record<keyof PdsQuestion, string>>;

function validate(form: PdsQuestion): FormErrors {
    const errors: FormErrors = {};

    // Every question must be answered (not null/undefined)
    for (const { key, label } of BOOLEAN_QUESTIONS) {
        if (form[key] === null || form[key] === undefined) {
            errors[key] = `${label} must be answered.`;
        }
    }

    // Conditional detail fields required when parent is YES
    for (const { parentKey, detailKey, label } of CONDITIONAL_DETAILS) {
        if (form[parentKey] === true) {
            const val = form[detailKey];
            if (!val || String(val).trim() === '') {
                errors[detailKey] = `${label} is required when answered YES.`;
            }
        }
    }

    return errors;
}

export default function QuestionsSection({ pdsData, onSave, saving }: Props) {
    const [form, setForm] = useState<PdsQuestion>({
        q34_a:         pdsData.questions?.q34_a         ?? null,
        q34_b:         pdsData.questions?.q34_b         ?? null,
        q34_details:   pdsData.questions?.q34_details   ?? '',
        q35_a:         pdsData.questions?.q35_a         ?? null,
        q35_a_details: pdsData.questions?.q35_a_details ?? '',
        q35_b:         pdsData.questions?.q35_b         ?? null,
        q35_b_date:    pdsData.questions?.q35_b_date    ?? '',
        q35_b_status:  pdsData.questions?.q35_b_status  ?? '',
        q36:           pdsData.questions?.q36           ?? null,
        q36_details:   pdsData.questions?.q36_details   ?? '',
        q37:           pdsData.questions?.q37           ?? null,
        q37_details:   pdsData.questions?.q37_details   ?? '',
        q38_a:         pdsData.questions?.q38_a         ?? null,
        q38_a_details: pdsData.questions?.q38_a_details ?? '',
        q38_b:         pdsData.questions?.q38_b         ?? null,
        q38_b_details: pdsData.questions?.q38_b_details ?? '',
        q39:           pdsData.questions?.q39           ?? null,
        q39_details:   pdsData.questions?.q39_details   ?? '',
        q40_a:         pdsData.questions?.q40_a         ?? null,
        q40_a_details: pdsData.questions?.q40_a_details ?? '',
        q40_b:         pdsData.questions?.q40_b         ?? null,
        q40_b_details: pdsData.questions?.q40_b_details ?? '',
        q40_c:         pdsData.questions?.q40_c         ?? null,
        q40_c_details: pdsData.questions?.q40_c_details ?? '',
    });

    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors]       = useState<FormErrors>({});

    const set = (key: keyof PdsQuestion, val: unknown) => {
        setForm(prev => {
            const next = { ...prev, [key]: val };

            // If a parent question is set to NO (false)
            // reset its dependent detail fields.
            if (val !== true) {
                CONDITIONAL_DETAILS.forEach(item => {
                    if (item.parentKey === key) {
                        // Only clear if no OTHER parent for this detail is currently TRUE
                        // (Relevant for Q34 where both 34a and 34b share 'q34_details')
                        const hasOtherActiveParent = CONDITIONAL_DETAILS.some(
                            d => d.detailKey === item.detailKey && 
                                d.parentKey !== key && 
                                next[d.parentKey] === true
                        );

                        if (!hasOtherActiveParent) {
                            (next as any)[item.detailKey] = '';
                        }
                    }
                });
            }

            return next;
        });

        if (submitted) {
            setErrors(prev => ({ ...prev, [key]: undefined }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);

        const errs = validate(form);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            // Scroll to the first question block that has an error
            const firstKey = Object.keys(errs)[0];
            document.getElementById(`field-${firstKey}`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        setErrors({});
        onSave('questions', form as unknown as Record<string, unknown>);
    };

    const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white";
    const errorInputClass = "w-full border border-red-400 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white";

    const ic  = (key: keyof PdsQuestion) => errors[key] ? errorInputClass : inputClass;
    const err = (key: keyof PdsQuestion) => errors[key]
        ? <p className="mt-1 text-xs text-red-500">{errors[key]}</p>
        : null;

    // Radio group with error highlight on the wrapper
    const RadioGroup = ({
        qKey, onTrue, onFalse,
    }: {
        qKey: keyof PdsQuestion;
        onTrue?: () => void;
        onFalse?: () => void;
    }) => (
        <div id={`field-${qKey}`}>
            <div className={`flex gap-6 ${errors[qKey] ? 'p-2 rounded-lg border border-red-300 bg-red-50' : ''}`}>
                {([true, false] as const).map(v => (
                    <label key={String(v)} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                            type="radio"
                            checked={form[qKey] === v}
                            onChange={() => {
                                set(qKey, v);
                                if (v === true) onTrue?.();
                                if (v === false) onFalse?.();
                            }}
                            className="accent-green-600"
                        />
                        <span className={form[qKey] === v ? (v ? 'text-green-700 font-medium' : 'text-gray-700 font-medium') : 'text-gray-600'}>
                            {v ? 'YES' : 'NO'}
                        </span>
                    </label>
                ))}
            </div>
            {err(qKey)}
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
                <h2 className="text-base font-semibold text-green-800 mb-1 uppercase">IX. Legal Declarations</h2>
                <p className="text-xs text-gray-500">
                    All questions must be answered. Any misrepresentation may result in administrative/criminal cases.
                </p>
            </div>

            <div className="space-y-3">

                {/* ── Q34 ── */}
                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50/40">
                    <p className="text-sm font-medium text-gray-800 mb-3">
                        34. Are you related by consanguinity or affinity to the appointing or recommending authority,
                        or to the chief of bureau or office or person who has immediate supervision over you in the Office,
                        Bureau of Department where you will be appointed,
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-500 mb-2">a. within the third degree? <span className="text-red-500">*</span></p>
                            <RadioGroup qKey="q34_a" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-2">b. Within the fourth degree (for LGU - Career Employees)? <span className="text-red-500">*</span></p>
                            <RadioGroup qKey="q34_b" />
                        </div>
                    </div>
                    {(form.q34_a === true || form.q34_b === true) && (
                        <div id="field-q34_details" className="mt-3">
                            <label className="block text-xs text-gray-500 mb-1">If YES, give details: <span className="text-red-500">*</span></label>
                            <input type="text" value={form.q34_details ?? ''}
                                onChange={e => set('q34_details', e.target.value)}
                                className={ic('q34_details')} />
                            {err('q34_details')}
                        </div>
                    )}
                </div>

                {/* ── Q35 ── */}
                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50/40">
                    <p className="text-sm font-medium text-gray-800 mb-3">35. Administrative &amp; Criminal Charges</p>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-gray-600 mb-2">
                                a. Have you ever been found guilty of any administrative offense? <span className="text-red-500">*</span>
                            </p>
                            <RadioGroup qKey="q35_a" />
                            {form.q35_a === true && (
                                <div id="field-q35_a_details" className="mt-2">
                                    <label className="block text-xs text-gray-500 mb-1">If YES, give details: <span className="text-red-500">*</span></label>
                                    <input type="text" value={form.q35_a_details ?? ''}
                                        onChange={e => set('q35_a_details', e.target.value)}
                                        className={ic('q35_a_details')} />
                                    {err('q35_a_details')}
                                </div>
                            )}
                        </div>
                        <div className="border-t border-gray-200 pt-3">
                            <p className="text-xs text-gray-600 mb-2">
                                b. Have you been criminally charged before any court? <span className="text-red-500">*</span>
                            </p>
                            <RadioGroup qKey="q35_b" />
                            {form.q35_b === true && (
                                <div className="grid grid-cols-2 gap-3 mt-2">
                                    <div id="field-q35_b_date">
                                        <label className="block text-xs text-gray-500 mb-1">Date Filed: <span className="text-red-500">*</span></label>
                                        <input type="text" value={form.q35_b_date ?? ''}
                                            onChange={e => set('q35_b_date', e.target.value)}
                                            className={ic('q35_b_date')} />
                                        {err('q35_b_date')}
                                    </div>
                                    <div id="field-q35_b_status">
                                        <label className="block text-xs text-gray-500 mb-1">Status of Case/s: <span className="text-red-500">*</span></label>
                                        <input type="text" value={form.q35_b_status ?? ''}
                                            onChange={e => set('q35_b_status', e.target.value)}
                                            className={ic('q35_b_status')} />
                                        {err('q35_b_status')}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Q36 ── */}
                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50/40">
                    <p className="text-sm font-medium text-gray-800 mb-3">
                        36. Have you ever been convicted of any crime or violation of any law, decree, ordinance
                        or regulation by any court or tribunal? <span className="text-red-500">*</span>
                    </p>
                    <RadioGroup qKey="q36" />
                    {form.q36 === true && (
                        <div id="field-q36_details" className="mt-2">
                            <label className="block text-xs text-gray-500 mb-1">If YES, give details: <span className="text-red-500">*</span></label>
                            <input type="text" value={form.q36_details ?? ''}
                                onChange={e => set('q36_details', e.target.value)}
                                className={ic('q36_details')} />
                            {err('q36_details')}
                        </div>
                    )}
                </div>

                {/* ── Q37 ── */}
                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50/40">
                    <p className="text-sm font-medium text-gray-800 mb-3">
                        37. Have you ever been separated from the service in any of the following modes: resignation, retirement,
                        dropped from the rolls, dismissal, termination, end of the term, finished contract or phased out (abolition)
                        in the public or private sector? <span className="text-red-500">*</span>
                    </p>
                    <RadioGroup qKey="q37" />
                    {form.q37 === true && (
                        <div id="field-q37" className="mt-2">
                            <label className="block text-xs text-gray-500 mb-1">If YES, give details: <span className="text-red-500">*</span></label>
                            <input type="text" value={form.q37_details ?? ''}
                                onChange={e => set('q37_details', e.target.value)}
                                className={ic('q37_details')} />
                            {err('q37_details')}
                        </div>
                    )}
                </div>

                {/* ── Q38 ── */}
                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50/40">
                    <p className="text-xs text-gray-800 mb-3">
                        <span className='font-medium text-sm'>38.</span> a. have you ever been a candidate in a national or local election held within the last year 
                        (except Barangay election)? <span className="text-red-500">*</span>
                    </p>
                    <div className='space-y-4'>
                        <div>
                            <RadioGroup qKey="q38_a" />
                            {form.q38_a === true && (
                                <div id="field-q38_a_details" className="mt-2">
                                    <label className="block text-xs text-gray-500 mb-1">If YES, give details: <span className="text-red-500">*</span></label>
                                    <input type="text" value={form.q38_a_details ?? ''}
                                        onChange={e => set('q38_a_details', e.target.value)}
                                        className={ic('q38_a_details')} />
                                    {err('q38_a_details')}
                                </div>
                            )}
                        </div>
                         <div className="border-t border-gray-200 pt-3">
                            <p className="text-xs text-gray-800 mb-2">
                                b. Have you resigned from government service during the three (3)-month period
                                before the last election to promote/actively campaign for a national or local candidate? <span className="text-red-500">*</span>
                            </p>
                            <RadioGroup qKey="q38_b" />
                            {form.q38_b === true && (
                                <div id="field-q38_b_details" className="mt-2">
                                    <label className="block text-xs text-gray-500 mb-1">If YES, give details: <span className="text-red-500">*</span></label>
                                    <input type="text" value={form.q38_b_details ?? ''}
                                        onChange={e => set('q38_b_details', e.target.value)}
                                        className={ic('q38_b_details')} />
                                    {err('q38_b_details')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Q39 ── */}
                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50/40">
                    <p className="text-sm font-medium text-gray-800 mb-3">
                        39. Have you acquired the status of an immigrant or permanent resident of another country? <span className="text-red-500">*</span>
                    </p>
                    <RadioGroup qKey="q39" />
                    {form.q39 === true && (
                        <div id="field-q39_details" className="mt-2">
                            <label className="block text-xs text-gray-500 mb-1">If YES, give details: <span className="text-red-500">*</span></label>
                            <input type="text" value={form.q39_details ?? ''}
                                onChange={e => set('q39_details', e.target.value)}
                                className={ic('q39_details')} />
                            {err('q39_details')}
                        </div>
                    )}
                </div>

                {/* ── Q40 ── */}
                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50/40">
                    <p className="text-sm font-medium text-gray-800 mb-3">
                        40. Pursuant to: (a) Indigenous People's Act (RA 8371); (B) Magna Carta for Disabled Persons (ra 7277, as ammended); 
                        and (c) Expanded Solo Parents Welfare Act (RA 11861), please answer the following items:
                    </p>
                    <div className="space-y-4">
                        {([
                            { qKey: 'q40_a' as const, detailKey: 'q40_a_details' as const, label: 'a. Are you a member of any indigenous group?' },
                            { qKey: 'q40_b' as const, detailKey: 'q40_b_details' as const, label: 'b. Are you a person with disability?' },
                            { qKey: 'q40_c' as const, detailKey: 'q40_c_details' as const, label: 'c. Are you a solo parent?' },
                        ]).map(({ qKey, detailKey, label }, idx) => (
                            <div key={qKey} className={idx > 0 ? 'border-t border-gray-200 pt-3' : ''}>
                                <p className="text-xs text-gray-600 mb-2">{label} <span className="text-red-500">*</span></p>
                                <RadioGroup qKey={qKey} />
                                {form[qKey] === true && (
                                    <div id={`field-${detailKey}`} className="mt-2">
                                        <label className="block text-xs text-gray-500 mb-1">If YES, please specify ID No: <span className="text-red-500">*</span></label>
                                        <input type="text" value={form[detailKey] ?? ''}
                                            onChange={e => set(detailKey, e.target.value)}
                                            className={ic(detailKey)} />
                                        {err(detailKey)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
             <div className="sticky bottom-0 bg-white pt-3 pb-1 -mx-1 px-1 flex justify-end">
                <button type="submit" disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm cursor-pointer">
                    {saving
                        ? <><Spinner />Saving Answers</>
                        : <><Save className="w-4 h-4" />Save Answers</>
                    }
                </button>
            </div>
        </form>
    );
}