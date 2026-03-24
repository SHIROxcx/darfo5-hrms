import { useState } from 'react';
import { Save } from 'lucide-react';
import type { User, PdsData, PdsEducation, PdsSaveCallback } from '@/types/pds';
import { Spinner } from '@/components/ui/spinner';

interface Props { user: User; pdsData: PdsData; onSave: PdsSaveCallback; saving: boolean; }

const LEVELS: PdsEducation['level'][] = ['Elementary', 'Secondary', 'Vocational', 'College', 'Graduate Studies'];

const DEFAULT_EDU = (level: PdsEducation['level']): PdsEducation => ({
    level, school_name: '', course: '', period_from: '', period_to: '',
    highest_level: '', year_graduated: '', honors_received: '',
});

// All columns that must be filled (with N/A if not applicable)
const REQUIRED_COLS: Array<keyof PdsEducation> = [
    'school_name', 'course', 'period_from', 'period_to',
    'highest_level', 'year_graduated', 'honors_received',
];

type RowErrors = Partial<Record<keyof PdsEducation, string>>;
type FormErrors = RowErrors[];

function validate(rows: PdsEducation[]): FormErrors {
    return rows.map(row => {
        const errs: RowErrors = {};
        for (const key of REQUIRED_COLS) {
            const val = row[key];
            if (!val || String(val).trim() === '') {
                errs[key] = 'Required. Write N/A if not applicable.';
            }
        }
        return errs;
    });
}

function hasErrors(errors: FormErrors): boolean {
    return errors.some(e => Object.keys(e).length > 0);
}

export default function EducationSection({ pdsData, onSave, saving }: Props) {
    const init = LEVELS.map(level =>
        pdsData.education?.find(e => e.level === level) ?? DEFAULT_EDU(level)
    );
    const [rows, setRows] = useState<PdsEducation[]>(init);
    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors] = useState<FormErrors>(LEVELS.map(() => ({})));

    const setRow = (i: number, key: keyof PdsEducation, val: string) => {
        setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [key]: val } : r));
        if (submitted) {
            setErrors(prev => prev.map((e, idx) =>
                idx === i ? { ...e, [key]: undefined } : e
            ));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        const errs = validate(rows);
        if (hasErrors(errs)) {
            setErrors(errs);
            // Scroll to first error
            const firstRowIdx = errs.findIndex(e => Object.keys(e).length > 0);
            const firstKey = firstRowIdx >= 0 ? Object.keys(errs[firstRowIdx])[0] : null;
            if (firstKey) {
                document.getElementById(`edu-${firstRowIdx}-${firstKey}`)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }
        setErrors(LEVELS.map(() => ({})));
        onSave('education', { education: rows } as unknown as Record<string, unknown>);
    };

    const baseInput = "w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 bg-white transition-colors";
    const inputClass = `${baseInput} border-gray-200 focus:ring-green-500`;
    const errorInput = `${baseInput} border-red-400 focus:ring-red-400 bg-red-50`;

    const ic = (rowIdx: number, key: keyof PdsEducation) =>
        errors[rowIdx]?.[key] ? errorInput : inputClass;

    return (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
                <h2 className="text-base font-semibold text-green-800 mb-1 uppercase">III. Educational Background</h2>
                <p className="text-xs text-gray-500">
                    Write school names and degree/course in full. Do not abbreviate.{' '}
                    <span className="font-medium text-green-700">Write N/A if not applicable.</span>
                </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 uppercase">
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-32">Level</th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600">Name of School <span className="text-red-500">*</span></th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600">Degree/Course <span className="text-red-500">*</span></th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-20">From <span className="text-red-500">*</span></th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-20">To <span className="text-red-500">*</span></th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-24">Highest Level/<br />Units Earned <span className="text-red-500">*</span></th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-20">Year Graduated <span className="text-red-500">*</span></th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600">Scholarship/<br />Honors Received <span className="text-red-500">*</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <tr key={row.level} className={`border-b border-gray-100 last:border-0 uppercase ${
                                errors[i] && Object.keys(errors[i]).length > 0
                                    ? 'bg-red-50/30'
                                    : ''
                            }`}>
                                <td className="px-3 py-2 font-medium text-gray-700 bg-gray-50 align-top pt-3">
                                    {row.level}
                                </td>
                                {([
                                    { key: 'school_name'    as const, placeholder: 'School name'     },
                                    { key: 'course'         as const, placeholder: 'Degree / Course' },
                                    { key: 'period_from'    as const, placeholder: 'yyyy'            },
                                    { key: 'period_to'      as const, placeholder: 'yyyy'            },
                                    { key: 'highest_level'  as const, placeholder: ''                },
                                    { key: 'year_graduated' as const, placeholder: 'yyyy'            },
                                    { key: 'honors_received'as const, placeholder: ''                },
                                ] as const).map(({ key, placeholder }) => (
                                    <td key={key} className="px-2 py-1.5 align-top">
                                        <input
                                            id={`edu-${i}-${key}`}
                                            type="text"
                                            value={(row[key] as string) ?? ''}
                                            onChange={e => setRow(i, key, e.target.value)}
                                            placeholder={placeholder}
                                            className={ic(i, key)}
                                        />
                                        {errors[i]?.[key] && (
                                            <p className="mt-0.5 text-[10px] text-red-500 leading-tight normal-case">
                                                Write N/A if not applicable.
                                            </p>
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end">
                <button type="submit" disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm cursor-pointer">
                    {saving
                        ? <><Spinner />Saving Education</>
                        : <><Save className="w-4 h-4" />Save Education</>
                    }
                </button>
            </div>
        </form>
    );
}