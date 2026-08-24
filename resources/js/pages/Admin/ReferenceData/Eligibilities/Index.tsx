import LookupCrudTable from '../components/LookupCrudTable';

interface Eligibility {
    id: number;
    title: string;
    abbreviation: string | null;
}

interface Props {
    eligibilities: Eligibility[];
}

export default function EligibilitiesIndex({ eligibilities }: Props) {
    return (
        <LookupCrudTable<Eligibility>
            pageTitle="Eligibilities"
            heading="Eligibilities"
            description="Manage civil service eligibility titles used in the PDS form."
            baseUrl="/admin/reference-data/eligibilities"
            items={eligibilities}
            fields={[
                { key: 'title', label: 'Eligibility Title', required: true, placeholder: 'e.g. Career Service Professional' },
                { key: 'abbreviation', label: 'Abbreviation', placeholder: 'e.g. CSP' },
            ]}
            getLabel={e => e.title}
            itemNoun="Eligibility"
            breadcrumbs={[
                { title: 'Reference Data', href: '/admin/reference-data/divisions' },
                { title: 'Eligibilities', href: '/admin/reference-data/eligibilities' },
            ]}
        />
    );
}
