import { Dot, GraduationCap } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { ProfileUser } from '@/pages/Profile/types';
import { educationPeriod, SectionBlock } from './shared';

interface Props {
    user: ProfileUser;
}

export default function EducationSection({ user }: Props) {
    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <h2 className="text-base font-semibold text-green-800">Education</h2>
            </div>
            <Separator />
            <SectionBlock title="Bachelor's Degree">
                {user.degrees.length === 0
                    ? <p className="text-sm text-gray-400 italic">No college education records found in PDS.</p>
                    : <div className="space-y-3">{user.degrees.map(d => (
                        <div key={d.id} className="flex items-start gap-3 rounded-xl border border-gray-100 p-4 hover:bg-gray-50 transition">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white"><GraduationCap className="h-5 w-5" /></div>
                            <div>
                                <p className="font-semibold text-gray-700 text-sm">{d.degree ?? '—'}</p>
                                {d.school_name && <p className="text-xs text-gray-500 mt-0.5">{d.school_name}</p>}
                                <p className="text-xs text-gray-400 mt-0.5">{educationPeriod(d.period_from, d.period_to) ?? '—'}{d.year_graduated && <><Dot className="w-5 h-5 inline" />Graduated {d.year_graduated}</>}</p>
                                {d.honors_received && <p className="text-xs text-green-700 mt-0.5">{d.honors_received}</p>}
                            </div>
                        </div>
                    ))}</div>
                }
            </SectionBlock>
            <SectionBlock title="Graduate Studies">
                {user.graduate_studies.length === 0
                    ? <p className="text-sm text-gray-400 italic">No graduate studies records found in PDS.</p>
                    : <div className="space-y-3">{user.graduate_studies.map(g => (
                        <div key={g.id} className="flex items-start gap-3 rounded-xl border border-gray-100 p-4 hover:bg-gray-50 transition">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white"><GraduationCap className="h-5 w-5" /></div>
                            <div>
                                <p className="font-semibold text-gray-900 text-sm">{g.program ?? '—'}</p>
                                {g.school_name && <p className="text-xs text-gray-500 mt-0.5">{g.school_name}</p>}
                                <p className="text-xs text-gray-400 mt-0.5">{educationPeriod(g.period_from, g.period_to) ?? '—'}</p>
                            </div>
                        </div>
                    ))}</div>
                }
            </SectionBlock>
        </div>
    );
}
