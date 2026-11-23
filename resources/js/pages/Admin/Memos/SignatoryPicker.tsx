import { Link } from '@inertiajs/react';
import { ArrowDown, ArrowUp, X } from 'lucide-react';
import LimitedInput from '@/components/limited-input';
import { MEMO_MAX, MEMO_MAX_SIGNATORIES } from '@/lib/memo-limits';
import { index as signatoriesIndex } from '@/routes/admin/signatories';
import type { PickableSignatory, PickedSignatory } from '@/types/memo';

interface Props {
    /** The active signatories HR can still pick from. */
    available: PickableSignatory[];
    value: PickedSignatory[];
    onChange: (next: PickedSignatory[]) => void;
    /** Messages by row position (the server's, for example "That signatory is not in the active list."). */
    rowErrors: Record<number, string>;
    /** A message about the list as a whole (too many, for example). */
    listError?: string;
}

const iconButton =
    'flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40';

/** Who signs the memo: picked from the saved list, in the order they print, each with an optional label like "Approved by". */
export default function SignatoryPicker({ available, value, onChange, rowErrors, listError }: Props) {
    const byId = new Map(available.map(person => [person.id, person]));
    const chosen = new Set(value.map(row => row.signatory_id));
    const remaining = available.filter(person => !chosen.has(person.id));
    const full = value.length >= MEMO_MAX_SIGNATORIES;

    const move = (from: number, to: number) => {
        const next = [...value];
        const [row] = next.splice(from, 1);
        next.splice(to, 0, row);
        onChange(next);
    };

    return (
        <div>
            {value.length === 0 ? (
                <p className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-sm italic text-gray-400">
                    No signatories yet. Pick who signs this memo below.
                </p>
            ) : (
                <ol className="space-y-2">
                    {value.map((row, i) => {
                        const person = byId.get(row.signatory_id);
                        return (
                            <li key={row.signatory_id} className="rounded-lg border border-gray-200 p-3">
                                <div className="flex flex-wrap items-start gap-3">
                                    <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-700">{i + 1}</span>
                                    <div className="min-w-0 flex-1">
                                        {person ? (
                                            <p className="text-sm font-semibold text-gray-800">
                                                {person.name} <span className="font-normal text-gray-500">· {person.position}</span>
                                            </p>
                                        ) : (
                                            <p className="text-sm italic text-red-500">This signatory is no longer active. Remove them or pick someone else.</p>
                                        )}
                                        <div className="mt-2 max-w-xs">
                                            <LimitedInput
                                                maxLength={MEMO_MAX.label}
                                                value={row.label}
                                                placeholder="Label (optional), e.g. Approved by"
                                                aria-label={`Label for signatory ${i + 1}`}
                                                onChange={e => onChange(value.map((r, j) => (j === i ? { ...r, label: e.target.value } : r)))}
                                                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1">
                                        <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move up" title="Move up" className={iconButton}>
                                            <ArrowUp className="h-4 w-4" />
                                        </button>
                                        <button type="button" onClick={() => move(i, i + 1)} disabled={i === value.length - 1} aria-label="Move down" title="Move down" className={iconButton}>
                                            <ArrowDown className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onChange(value.filter((_, j) => j !== i))}
                                            aria-label="Remove signatory"
                                            title="Remove"
                                            className={`${iconButton} text-red-500 hover:bg-red-50`}
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                                {rowErrors[i] && <p role="alert" className="mt-2 text-xs text-red-500">{rowErrors[i]}</p>}
                            </li>
                        );
                    })}
                </ol>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-3">
                <select
                    value=""
                    disabled={full || remaining.length === 0}
                    onChange={e => {
                        const id = Number(e.target.value);
                        if (id) onChange([...value, { signatory_id: id, label: '' }]);
                    }}
                    aria-label="Add a signatory"
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <option value="">{full ? `Up to ${MEMO_MAX_SIGNATORIES} signatories` : remaining.length === 0 ? 'No more signatories to add' : '+ Add a signatory…'}</option>
                    {remaining.map(person => (
                        <option key={person.id} value={person.id}>
                            {person.name} — {person.position}
                        </option>
                    ))}
                </select>
                <Link href={signatoriesIndex().url} className="text-xs font-semibold text-green-700 hover:text-green-800">
                    Manage the signatory list
                </Link>
            </div>
            {listError && <p role="alert" className="mt-2 text-xs text-red-500">{listError}</p>}
        </div>
    );
}
