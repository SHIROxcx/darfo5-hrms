// OtherInfoSection.tsx
import { useState } from 'react';
import { Save, Plus, X } from 'lucide-react';
import type { User, PdsData, PdsOtherInfo, PdsSaveCallback } from '@/types/pds';

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
                    <span key={i} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full border border-blue-100">
                        {item}
                        <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="text-blue-400 hover:text-blue-700"><X className="w-3 h-3" /></button>
                    </span>
                ))}
            </div>
            <div className="flex gap-2">
                <input type="text" value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
                    placeholder={`Add ${label.toLowerCase()}...`}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                <button type="button" onClick={add} className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
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
                <h2 className="text-base font-semibold text-gray-900 mb-1">VIII. Other Information</h2>
                <p className="text-xs text-gray-500">Type each item and press Enter or click + to add.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <TagInput label="31. Special Skills & Hobbies" items={form.special_skills ?? []}
                    onChange={v => setForm(p => ({ ...p, special_skills: v }))} />
                <TagInput label="32. Non-Academic Distinctions / Recognition" items={form.non_academic_distinctions ?? []}
                    onChange={v => setForm(p => ({ ...p, non_academic_distinctions: v }))} />
                <TagInput label="33. Membership in Association/Organization" items={form.organization_memberships ?? []}
                    onChange={v => setForm(p => ({ ...p, organization_memberships: v }))} />
            </div>
            <div className="flex justify-end">
                <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm">
                    <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Other Information'}
                </button>
            </div>
        </form>
    );
}