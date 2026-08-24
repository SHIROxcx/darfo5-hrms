import LookupCrudTable from '../components/LookupCrudTable';

interface BachelorsDegree {
    id: number;
    degree: string;
    abbreviation: string | null;
}

interface Props {
    degrees: BachelorsDegree[];
}

export default function BachelorsDegreesIndex({ degrees }: Props) {
    return (
        <LookupCrudTable<BachelorsDegree>
            pageTitle="Bachelor's Degrees"
            heading="Bachelor's Degrees"
            description="Manage bachelor's degree names used in the PDS form."
            baseUrl="/admin/reference-data/bachelors-degrees"
            items={degrees}
            fields={[
                { key: 'degree', label: 'Degree', required: true, placeholder: 'e.g. Bachelor of Science in Computer Science' },
                { key: 'abbreviation', label: 'Abbreviation', placeholder: 'e.g. BSCS' },
            ]}
            getLabel={d => d.degree}
            itemNoun="Bachelor's Degree"
            breadcrumbs={[
                { title: 'Reference Data', href: '/admin/reference-data/divisions' },
                { title: "Bachelor's Degrees", href: '/admin/reference-data/bachelors-degrees' },
            ]}
        />
    );
}
