// OtherInfoSection.tsx
import { useState } from 'react';
import { Save, Plus, X } from 'lucide-react';
import type { User, PdsData, PdsOtherInfo, PdsSaveCallback } from '@/types/pds';
import { Spinner } from '@/components/ui/spinner';

interface Props { user: User; pdsData: PdsData; onSave: PdsSaveCallback; saving: boolean; }

function TagInput({ label, items, onChange }: { label: string; items: string[]; onChange: (v: string[]) => void }) {
    const [input, setInput] = useState('');
    const add = () => {
        if (input.trim()) { onChange([...items, input.trim()]); setInput(''); }
    };
    return (
        <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{label}</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
                {items.map((item, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full border border-green-100">
                        {item}
                        <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="text-green-400 hover:text-green-700 cursor-pointer"><X className="w-3 h-3" /></button>
                    </span>
                ))}
            </div>
            <div className="flex gap-2">
                <input type="text" value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
                    placeholder={`Add ${label.toLowerCase()}`}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
                <button type="button" onClick={add} className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-green-700 rounded-lg text-sm hover:bg-gray-200 cursor-pointer">
                    <Plus className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

export default function OtherInfoSection({ pdsData, onSave, saving }: Props) {
    const [form, setForm] = useState<PdsOtherInfo>({
        special_skills: pdsData.other_info?.special_skills ?? [],
        non_academic_distinctions: pdsData.other_info?.non_academic_distinctions ?? [],
        organization_memberships: pdsData.other_info?.organization_memberships ?? [],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave('other_info', form as unknown as Record<string, unknown>);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <h2 className="text-base font-semibold text-green-800 mb-1 uppercase">VIII. Other Information</h2>
                <p className="text-xs text-gray-500">Type each item and press Enter or click + to add.</p>
            </div>
            <div className="grid grid-cols-1 gap-6">
                <TagInput label="Special Skills & Hobbies" items={form.special_skills ?? []}
                    onChange={v => setForm(p => ({ ...p, special_skills: v }))} />
                <TagInput label="Non-Academic Distinctions / Recognition" items={form.non_academic_distinctions ?? []}
                    onChange={v => setForm(p => ({ ...p, non_academic_distinctions: v }))} />
                <TagInput label="Membership in Association/Organization" items={form.organization_memberships ?? []}
                    onChange={v => setForm(p => ({ ...p, organization_memberships: v }))} />
            </div>
            <div className="flex justify-end">
                <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm cursor-pointer">
                    {saving
                        ? <><Spinner />Saving Other Information</>
                        : <><Save className="w-4 h-4" />Save Other Information</>
                    }
                </button>
            </div>
        </form>
    );
}