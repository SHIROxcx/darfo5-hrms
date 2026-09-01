import { Separator } from '@/components/ui/separator';
import type { ProfileUser } from '@/pages/Profile/types';
import { EditBtn, InfoGrid } from './shared';

interface Props {
    user: ProfileUser;
    isOwn: boolean;
    onEdit: () => void;
}

export default function PersonalSection({ user, isOwn, onEdit }: Props) {
    const pi = user.personal_info;

    return (
        <div className="space-y-5">
            <div className="flex items-start justify-between">
                <h2 className="text-base font-semibold text-green-800">Overview</h2>
                {isOwn && <EditBtn onClick={onEdit} />}
            </div>
            <Separator />
            <InfoGrid showAll items={[
                { label: 'First Name',     value: user.first_name },
                { label: 'Middle Name',    value: user.middle_name },
                { label: 'Last Name',      value: user.last_name },
                { label: 'Sex',            value: pi?.sex },
                { label: 'Civil Status',   value: pi?.civil_status },
                { label: 'Suffix',         value: user.name_ext },
                { label: 'Blood Type',     value: pi?.blood_type },
                { label: 'Height (m)',     value: pi?.height },
                { label: 'Weight (kg)',    value: pi?.weight },
                { label: 'Date of Birth',  value: pi?.date_of_birth ? new Date(pi.date_of_birth).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null },
                { label: 'Place of Birth', value: pi?.birth_place },
                { label: 'Mobile Number',  value: pi?.mobile_number },
                { label: 'Email',          value: user.email },
            ]} />
        </div>
    );
}
