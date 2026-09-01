import { Award } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { ProfileUser } from '@/pages/Profile/types';

interface Props {
    user: ProfileUser;
}

export default function EligibilitySection({ user }: Props) {
    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <h2 className="text-base font-semibold text-green-800">Eligibilities & Licenses</h2>
            </div>
            <Separator />
            {user.eligibilities.length === 0
                ? <p className="text-sm text-gray-400 italic">No eligibility records found in PDS.</p>
                : <div className="space-y-3">{user.eligibilities.map(e => (
                    <div key={e.id} className="flex items-start gap-3 rounded-xl border border-gray-100 p-4 hover:bg-gray-50 transition">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white"><Award className="h-5 w-5" /></div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">{e.eligibility ?? '—'}</p>
                            {e.date_of_examination && <p className="text-xs text-gray-500">{new Date(e.date_of_examination).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>}
                            {e.place_of_examination && <p className="text-xs text-gray-500">{e.place_of_examination}</p>}
                            {e.rating && <p className="text-xs text-gray-500">Rating: {e.rating}</p>}
                            {e.license_number && <p className="text-xs text-gray-500 mt-0.5">License No. {e.license_number}{e.license_validity && ` · Valid until ${new Date(e.license_validity).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}</p>}
                        </div>
                    </div>
                ))}</div>
            }
        </div>
    );
}
