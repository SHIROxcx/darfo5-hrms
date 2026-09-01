import { Separator } from '@/components/ui/separator';
import type { ProfileUser } from '@/pages/Profile/types';
import { EditBtn, InfoGrid, lengthOfService } from './shared';

interface Props {
    user: ProfileUser;
    canEditCompany: boolean;
    onEdit: () => void;
}

export default function CompanySection({ user, canEditCompany, onEdit }: Props) {
    const ep = user.employee_profile;

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <h2 className="text-base font-semibold text-green-800">Company Information</h2>
                {canEditCompany && <EditBtn onClick={onEdit} />}
            </div>
            <Separator />
            <InfoGrid items={[
                { label: 'Employee No.',      value: ep?.employee_number },
                { label: 'Position',          value: ep?.position },
                { label: 'Employment Type',   value: ep?.employment_type },
                { label: 'Salary Grade',      value: ep?.salary_grade },
                { label: 'Agency',            value: ep?.place_assign },
                { label: 'Division / Office', value: ep?.division },
                { label: 'Section / Unit',    value: ep?.section },
                { label: 'Date Hired',        value: ep?.date_hired ? new Date(ep.date_hired).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null },
                { label: 'Length in Service', value: lengthOfService(ep?.date_hired) },
            ]} />
        </div>
    );
}
