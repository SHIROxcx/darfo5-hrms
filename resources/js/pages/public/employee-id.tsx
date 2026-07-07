import { Head } from '@inertiajs/react';
import { BadgeCheck, ShieldX, Building2, Briefcase } from 'lucide-react';

type Employee = {
    employee_number: string;
    name: string;
    position: string | null;
    office: string | null;
    photo: string | null;
    status: boolean;
};

type Props = {
    found: boolean;
    employee?: Employee;
};

export default function EmployeeId({ found, employee }: Props) {
    return (
        <>
            <Head title={found && employee ? `${employee.name} — Employee ID` : 'Employee Not Found'} />

            <div className="relative flex h-screen w-screen flex-col overflow-hidden">
                {/* ── Responsive Background Image (same as Welcome/Login) ── */}
                <picture className="absolute inset-0 z-0 h-full w-full">
                    <source media="(min-width: 1024px)" srcSet="/images/desktop-wallpaper.png" />
                    <source media="(min-width: 640px)" srcSet="/images/tablet-wallpaper.png" />
                    <img
                        src="/images/mobile-wallpaper.png"
                        alt=""
                        className="h-full w-full object-cover object-center"
                    />
                </picture>

                <div className="absolute inset-0 bg-linear-to-r from-green-900/80 via-green-700/60 to-green-500/50 opacity-50" />

                <main className="relative z-20 flex flex-1 items-center justify-center px-6">
                    <div className="w-full max-w-sm rounded-xl border border-white/20 bg-white p-8 text-center shadow-2xl backdrop-blur-sm">

                        <div className="mb-4 flex justify-center">
                            <img
                                src="/images/da-masarig-logo.png"
                                alt="DA RFO 5 Masarig Logo"
                                className="h-18 w-18 object-contain"
                            />
                        </div>

                        {found && employee ? (
                            <>
                                <div className="mb-4 flex justify-center">
                                    {employee.photo ? (
                                        <img
                                            src={employee.photo}
                                            alt={employee.name}
                                            className="h-32 w-32 rounded-full border-4 border-green-600 object-cover shadow-md"
                                        />
                                    ) : (
                                        <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-green-600 bg-green-50 text-xs text-gray-400">
                                            No Photo
                                        </div>
                                    )}
                                </div>

                                <h1 className="text-xl font-bold uppercase tracking-wide text-green-700">
                                    {employee.name}
                                </h1>

                                {employee.position && (
                                    <p className="mt-1 flex items-center justify-center gap-1 text-sm font-medium text-gray-700">
                                        {employee.position}
                                    </p>
                                )}

                                {employee.office && (
                                    <p className="mt-1 flex items-center justify-center gap-1 text-sm text-gray-500">
                                        {employee.office}
                                    </p>
                                )}

                                <div className="mt-4 border-t border-gray-100 pt-4">
                                    <p className="text-xs text-gray-400">Employee No.</p>
                                    <p className="font-mono text-sm text-gray-600">{employee.employee_number}</p>
                                </div>

                                <div
                                    className={`mt-4 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ${
                                        employee.status
                                            ? 'bg-green-50 text-green-700'
                                            : 'bg-gray-50 text-gray-200'
                                    }`}
                                >
                                    {employee.status ? 'Active' : 'Inactive'}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="mb-4 flex justify-center">
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
                                        <ShieldX className="h-10 w-10 text-red-400" />
                                    </div>
                                </div>
                                <h1 className="text-lg font-semibold text-gray-700">ID Not Found</h1>
                                <p className="mt-1 text-sm text-gray-500">
                                    This employee ID could not be verified.
                                </p>
                            </>
                        )}

                        <p className="mt-6 text-xs text-gray-400">DARFO 5 HRMS — Employee Verification</p>
                    </div>
                </main>

                <footer className="relative z-20 py-4 text-center text-xs text-white/50">
                    © DARFO 5 - ICT UNIT {new Date().getFullYear()}
                </footer>
            </div>
        </>
    );
}