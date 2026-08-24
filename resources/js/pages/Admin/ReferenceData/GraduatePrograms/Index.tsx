import LookupCrudTable from '../components/LookupCrudTable';

interface GraduateProgram {
    id: number;
    program: string;
    abbreviation: string | null;
}

interface Props {
    programs: GraduateProgram[];
}

export default function GraduateProgramsIndex({ programs }: Props) {
    return (
        <LookupCrudTable<GraduateProgram>
            pageTitle="Graduate Programs"
            heading="Graduate Programs"
            description="Manage graduate study program names used in the PDS form."
            baseUrl="/admin/reference-data/graduate-programs"
            items={programs}
            fields={[
                { key: 'program', label: 'Program', required: true, placeholder: 'e.g. Master in Public Administration' },
                { key: 'abbreviation', label: 'Abbreviation', placeholder: 'e.g. MPA' },
            ]}
            getLabel={p => p.program}
            itemNoun="Graduate Program"
            breadcrumbs={[
                { title: 'Reference Data', href: '/admin/reference-data/divisions' },
                { title: 'Graduate Programs', href: '/admin/reference-data/graduate-programs' },
            ]}
        />
    );
}
