import { useState } from 'react';
import { Save } from 'lucide-react';
import type { User, PdsData, PdsQuestion, PdsSaveCallback } from '@/types/pds';

interface Props { user: User; pdsData: PdsData; onSave: PdsSaveCallback; saving: boolean; }

function YesNo({ label, yesVal, noVal, onYes, onNo, showDetails, detailsVal, onDetails, detailsLabel = 'If YES, give details:' }: {
    label: string; yesVal: boolean | null | undefined; noVal?: boolean | null | undefined;
    onYes: (v: boolean) => void; onNo: (v: boolean) => void;
    showDetails?: boolean; detailsVal?: string; onDetails?: (v: string) => void; detailsLabel?: string;
}) {
    return (
        <div className="rounded-xl border border-gray-200 p-4 bg-gray-50/40">
            <p className="text-sm text-gray-700 mb-3 leading-relaxed">{label}</p>
            <div className="flex gap-6 mb-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name={`q_${label.slice(0,10)}`} checked={yesVal === true}
                        onChange={() => onYes(true)} className="accent-blue-600" />
                    <span className={yesVal === true ? 'text-blue-700 font-medium' : 'text-gray-600'}>YES</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name={`q_${label.slice(0,10)}`} checked={yesVal === false}
                        onChange={() => onNo(false)} className="accent-blue-600" />
                    <span className={yesVal === false ? 'text-gray-700 font-medium' : 'text-gray-600'}>NO</span>
                </label>
            </div>
            {showDetails && yesVal === true && onDetails && (
                <div className="mt-2">
                    <label className="block text-xs text-gray-500 mb-1">{detailsLabel}</label>
                    <input type="text" value={detailsVal ?? ''} onChange={e => onDetails(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                </div>
            )}
        </div>
    );
}

export default function QuestionsSection({ pdsData, onSave, saving }: Props) {
    const [form, setForm] = useState<PdsQuestion>({
        q34_a: pdsData.questions?.q34_a ?? null,
        q34_b: pdsData.questions?.q34_b ?? null,
        q34_details: pdsData.questions?.q34_details ?? '',
        q35_a: pdsData.questions?.q35_a ?? null,
        q35_a_details: pdsData.questions?.q35_a_details ?? '',
        q35_b: pdsData.questions?.q35_b ?? null,
        q35_b_date: pdsData.questions?.q35_b_date ?? '',
        q35_b_status: pdsData.questions?.q35_b_status ?? '',
        q36: pdsData.questions?.q36 ?? null,
        q36_details: pdsData.questions?.q36_details ?? '',
        q37_a: pdsData.questions?.q37_a ?? null,
        q37_a_details: pdsData.questions?.q37_a_details ?? '',
        q37_b: pdsData.questions?.q37_b ?? null,
        q37_b_details: pdsData.questions?.q37_b_details ?? '',
        q38: pdsData.questions?.q38 ?? null,
        q38_details: pdsData.questions?.q38_details ?? '',
        q39: pdsData.questions?.q39 ?? null,
        q39_details: pdsData.questions?.q39_details ?? '',
        q40_a: pdsData.questions?.q40_a ?? null,
        q40_a_details: pdsData.questions?.q40_a_details ?? '',
        q40_b: pdsData.questions?.q40_b ?? null,
        q40_b_details: pdsData.questions?.q40_b_details ?? '',
        q40_c: pdsData.questions?.q40_c ?? null,
        q40_c_details: pdsData.questions?.q40_c_details ?? '',
    });

    const set = (key: keyof PdsQuestion, val: unknown) => setForm(prev => ({ ...prev, [key]: val }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave('questions', form as unknown as Record<string, unknown>);
    };

    const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <h2 className="text-base font-semibold text-gray-900 mb-1">IX. Questions (Page 4)</h2>
                <p className="text-xs text-gray-500">Answer all questions truthfully. Any misrepresentation may result in administrative/criminal cases.</p>
            </div>

            <div className="space-y-3">
                {/* Q34 */}
                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50/40">
                    <p className="text-sm font-medium text-gray-800 mb-1">34. Are you related by consanguinity or affinity to the appointing or recommending authority, or to the chief of bureau or person who has immediate supervision over you?</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <div>
                            <p className="text-xs text-gray-500 mb-2">a. Within the third degree?</p>
                            <div className="flex gap-6">
                                {[true, false].map(v => (
                                    <label key={String(v)} className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input type="radio" checked={form.q34_a === v} onChange={() => set('q34_a', v)} className="accent-blue-600" />
                                        <span>{v ? 'YES' : 'NO'}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-2">b. Within the fourth degree (LGU)?</p>
                            <div className="flex gap-6">
                                {[true, false].map(v => (
                                    <label key={String(v)} className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input type="radio" checked={form.q34_b === v} onChange={() => set('q34_b', v)} className="accent-blue-600" />
                                        <span>{v ? 'YES' : 'NO'}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                    {(form.q34_a === true || form.q34_b === true) && (
                        <div className="mt-3">
                            <label className="block text-xs text-gray-500 mb-1">If YES, give details:</label>
                            <input type="text" value={form.q34_details ?? ''} onChange={e => set('q34_details', e.target.value)} className={inputClass} />
                        </div>
                    )}
                </div>

                {/* Q35 */}
                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50/40">
                    <p className="text-sm font-medium text-gray-800 mb-3">35. Administrative & Criminal Charges</p>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-gray-600 mb-2">a. Have you ever been found guilty of any administrative offense?</p>
                            <div className="flex gap-6 mb-1">
                                {[true, false].map(v => (
                                    <label key={String(v)} className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input type="radio" checked={form.q35_a === v} onChange={() => set('q35_a', v)} className="accent-blue-600" />
                                        <span>{v ? 'YES' : 'NO'}</span>
                                    </label>
                                ))}
                            </div>
                            {form.q35_a === true && (
                                <div className="mt-2">
                                    <label className="block text-xs text-gray-500 mb-1">If YES, give details:</label>
                                    <input type="text" value={form.q35_a_details ?? ''} onChange={e => set('q35_a_details', e.target.value)} className={inputClass} />
                                </div>
                            )}
                        </div>
                        <div className="border-t border-gray-200 pt-3">
                            <p className="text-xs text-gray-600 mb-2">b. Have you been criminally charged before any court?</p>
                            <div className="flex gap-6 mb-1">
                                {[true, false].map(v => (
                                    <label key={String(v)} className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input type="radio" checked={form.q35_b === v} onChange={() => set('q35_b', v)} className="accent-blue-600" />
                                        <span>{v ? 'YES' : 'NO'}</span>
                                    </label>
                                ))}
                            </div>
                            {form.q35_b === true && (
                                <div className="grid grid-cols-2 gap-3 mt-2">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Date Filed:</label>
                                        <input type="text" value={form.q35_b_date ?? ''} onChange={e => set('q35_b_date', e.target.value)} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Status of Case/s:</label>
                                        <input type="text" value={form.q35_b_status ?? ''} onChange={e => set('q35_b_status', e.target.value)} className={inputClass} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {[
                    { key: 'q36' as const, detailKey: 'q36_details' as const, label: '36. Have you ever been convicted of any crime or violation of any law, decree, ordinance or regulation by any court or tribunal?' },
                    { key: 'q38' as const, detailKey: 'q38_details' as const, label: '38. Have you ever been separated from the service (resignation, retirement, dropped from rolls, dismissal, termination, end of term, finished contract, or phased out)?' },
                    { key: 'q39' as const, detailKey: 'q39_details' as const, label: '39. Have you acquired the status of an immigrant or permanent resident of another country?' },
                ].map(({ key, detailKey, label }) => (
                    <div key={key} className="rounded-xl border border-gray-200 p-4 bg-gray-50/40">
                        <p className="text-sm text-gray-700 mb-3">{label}</p>
                        <div className="flex gap-6">
                            {[true, false].map(v => (
                                <label key={String(v)} className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input type="radio" checked={form[key] === v} onChange={() => set(key, v)} className="accent-blue-600" />
                                    <span>{v ? 'YES' : 'NO'}</span>
                                </label>
                            ))}
                        </div>
                        {form[key] === true && (
                            <div className="mt-2">
                                <label className="block text-xs text-gray-500 mb-1">If YES, give details:</label>
                                <input type="text" value={form[detailKey] ?? ''} onChange={e => set(detailKey, e.target.value)} className={inputClass} />
                            </div>
                        )}
                    </div>
                ))}

                {/* Q37 */}
                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50/40">
                    <p className="text-sm font-medium text-gray-800 mb-3">37. Election-related questions</p>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-gray-600 mb-2">a. Have you ever been a candidate in a national or local election held within the last year (except Barangay election)?</p>
                            <div className="flex gap-6 mb-1">
                                {[true, false].map(v => (
                                    <label key={String(v)} className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input type="radio" checked={form.q37_a === v} onChange={() => set('q37_a', v)} className="accent-blue-600" />
                                        <span>{v ? 'YES' : 'NO'}</span>
                                    </label>
                                ))}
                            </div>
                            {form.q37_a === true && (
                                <div className="mt-2">
                                    <label className="block text-xs text-gray-500 mb-1">If YES, give details:</label>
                                    <input type="text" value={form.q37_a_details ?? ''} onChange={e => set('q37_a_details', e.target.value)} className={inputClass} />
                                </div>
                            )}
                        </div>
                        <div className="border-t border-gray-200 pt-3">
                            <p className="text-xs text-gray-600 mb-2">b. Have you resigned from government service during the three (3)-month period before the last election to promote/actively campaign for a national or local candidate?</p>
                            <div className="flex gap-6 mb-1">
                                {[true, false].map(v => (
                                    <label key={String(v)} className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input type="radio" checked={form.q37_b === v} onChange={() => set('q37_b', v)} className="accent-blue-600" />
                                        <span>{v ? 'YES' : 'NO'}</span>
                                    </label>
                                ))}
                            </div>
                            {form.q37_b === true && (
                                <div className="mt-2">
                                    <label className="block text-xs text-gray-500 mb-1">If YES, give details:</label>
                                    <input type="text" value={form.q37_b_details ?? ''} onChange={e => set('q37_b_details', e.target.value)} className={inputClass} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Q40 */}
                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50/40">
                    <p className="text-sm font-medium text-gray-800 mb-3">40. Pursuant to RA 8381 (Indigenous People's Act), RA 828 (Magna Carta for Disabled Persons), and RA 8982 (Solo Parents Welfare Act):</p>
                    <div className="space-y-3">
                        {[
                            { key: 'q40_a' as const, detailKey: 'q40_a_details' as const, label: 'a. Are you a member of any indigenous group?' },
                            { key: 'q40_b' as const, detailKey: 'q40_b_details' as const, label: 'b. Are you a person with disability?' },
                            { key: 'q40_c' as const, detailKey: 'q40_c_details' as const, label: 'c. Are you a solo parent?' },
                        ].map(({ key, detailKey, label }, idx) => (
                            <div key={key} className={idx > 0 ? 'border-t border-gray-200 pt-3' : ''}>
                                <p className="text-xs text-gray-600 mb-2">{label}</p>
                                <div className="flex gap-6 mb-1">
                                    {[true, false].map(v => (
                                        <label key={String(v)} className="flex items-center gap-2 text-sm cursor-pointer">
                                            <input type="radio" checked={form[key] === v} onChange={() => set(key, v)} className="accent-blue-600" />
                                            <span>{v ? 'YES' : 'NO'}</span>
                                        </label>
                                    ))}
                                </div>
                                {form[key] === true && (
                                    <div className="mt-2">
                                        <label className="block text-xs text-gray-500 mb-1">If YES, please specify:</label>
                                        <input type="text" value={form[detailKey] ?? ''} onChange={e => set(detailKey, e.target.value)} className={inputClass} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm">
                    <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Answers'}
                </button>
            </div>
        </form>
    );
}