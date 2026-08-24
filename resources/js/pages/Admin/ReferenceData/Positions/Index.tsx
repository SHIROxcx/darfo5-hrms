import LookupCrudTable from '../components/LookupCrudTable';

interface Position {
    id: number;
    title: string;
    salary_grade: number;
}

interface Props {
    positions: Position[];
}

export default function PositionsIndex({ positions }: Props) {
    return (
        <LookupCrudTable<Position>
            pageTitle="Positions"
            heading="Positions"
            description="Manage job position titles and their salary grades."
            baseUrl="/admin/reference-data/positions"
            items={positions}
            fields={[
                { key: 'title', label: 'Position Title', required: true, placeholder: 'e.g. Computer Programmer I' },
                { key: 'salary_grade', label: 'Salary Grade', type: 'number', required: true, placeholder: 'e.g. 11' },
            ]}
            getLabel={p => p.title}
            itemNoun="Position"
            breadcrumbs={[
                { title: 'Reference Data', href: '/admin/reference-data/divisions' },
                { title: 'Positions', href: '/admin/reference-data/positions' },
            ]}
        />
    );
}
