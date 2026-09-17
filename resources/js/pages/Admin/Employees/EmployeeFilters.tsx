import { SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Combobox } from '@/components/combobox';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { EMPLOYMENT_TYPE_OPTIONS } from '@/lib/employment-type';

export interface FilterValues {
    status: string;
    employment_type: string;
    division: string;
}

interface Props {
    values: FilterValues;
    divisions: string[];
    onChange: (patch: Partial<FilterValues>) => void;
}

const EMPTY_FILTERS: FilterValues = { status: '', employment_type: '', division: '' };

const selectCls = 'border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white';
const desktopSelectCls = `${selectCls} min-w-40`;

function activeCount(values: FilterValues): number {
    return Object.values(values).filter(Boolean).length;
}

// Desktop: one field, applied immediately.
function FilterSelects({ values, divisions, onChange }: Props) {
    const divisionOptions = divisions.map(d => ({ value: d, label: d }));

    return (
        <>
            <select
                value={values.status}
                onChange={e => onChange({ status: e.target.value })}
                className={desktopSelectCls}
            >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending Approval</option>
                <option value="revoked">Revoked</option>
            </select>
            <select
                value={values.employment_type}
                onChange={e => onChange({ employment_type: e.target.value })}
                className={desktopSelectCls}
            >
                <option value="">All Employment Types</option>
                {EMPLOYMENT_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <Combobox
                options={divisionOptions}
                value={values.division}
                onChange={division => onChange({ division })}
                placeholder="All Divisions"
                searchPlaceholder="Search divisions..."
                emptyText="No division found."
                allLabel="All Divisions"
                className="min-w-40"
            />
        </>
    );
}

export default function EmployeeFilters({ values, divisions, onChange }: Props) {
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState<FilterValues>(values);

    // Keep the draft in sync whenever the sheet (re)opens, so it reflects
    // whatever was last applied (e.g. after a desktop change or a Clear).
    useEffect(() => {
        if (open) setDraft(values);
    }, [open, values]);

    function applyDraft() {
        onChange(draft);
        setOpen(false);
    }

    function clearAll() {
        setDraft(EMPTY_FILTERS);
        onChange(EMPTY_FILTERS);
        setOpen(false);
    }

    const count = activeCount(values);
    const divisionOptions = divisions.map(d => ({ value: d, label: d }));

    return (
        <>
            {/* Desktop — inline row */}
            <div className="hidden lg:flex gap-3 flex-wrap shrink-0">
                <FilterSelects values={values} divisions={divisions} onChange={onChange} />
            </div>

            {/* Mobile/tablet — Filters button + bottom sheet */}
            <div className="lg:hidden">
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <button
                            type="button"
                            className="relative flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            Filters
                            {count > 0 && (
                                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-green-600 px-1 text-xs font-semibold text-white">
                                    {count}
                                </span>
                            )}
                        </button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl">
                        <SheetHeader>
                            <SheetTitle>Filter Employees</SheetTitle>
                            <SheetDescription>Narrow down the employee list. Tap Apply to search.</SheetDescription>
                        </SheetHeader>
                        <div className="flex flex-col gap-3 overflow-y-auto px-4">
                            <select
                                value={draft.status}
                                onChange={e => setDraft(d => ({ ...d, status: e.target.value }))}
                                className={selectCls}
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="pending">Pending Approval</option>
                                <option value="revoked">Revoked</option>
                            </select>
                            <select
                                value={draft.employment_type}
                                onChange={e => setDraft(d => ({ ...d, employment_type: e.target.value }))}
                                className={selectCls}
                            >
                                <option value="">All Employment Types</option>
                                {EMPLOYMENT_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                            <Combobox
                                options={divisionOptions}
                                value={draft.division}
                                onChange={division => setDraft(d => ({ ...d, division }))}
                                placeholder="All Divisions"
                                searchPlaceholder="Search divisions..."
                                emptyText="No division found."
                                allLabel="All Divisions"
                                className="w-full"
                            />
                        </div>
                        <SheetFooter className="flex-row gap-2">
                            <button
                                type="button"
                                onClick={clearAll}
                                className="flex-1 cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                            >
                                Clear
                            </button>
                            <button
                                type="button"
                                onClick={applyDraft}
                                className="flex-1 cursor-pointer rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition"
                            >
                                Apply
                            </button>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
            </div>
        </>
    );
}
