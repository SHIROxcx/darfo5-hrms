import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login, register } from '@/routes';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Welcome" />

            <div className="relative flex h-screen w-screen flex-col overflow-hidden">

                {/* ── Responsive Background Image ── */}
                <picture className="absolute inset-0 z-0 h-full w-full">
                    <source media="(min-width: 1024px)" srcSet="/images/desktop-wallpaper.png" />
                    <source media="(min-width: 640px)"  srcSet="/images/tablet-wallpaper.png" />
                    <img
                        src="/images/mobile-wallpaper.png"
                        alt=""
                        className="h-full w-full object-cover object-center"
                    />
                </picture>

                {/* ── Gradient Overlay ── */}
                <div className="absolute inset-0 bg-linear-to-r from-green-900/80 via-green-700/60 to-green-500/50 opacity-50" />

                {/* ── Top Nav ── */}
                <header className="relative z-20 flex items-center justify-end gap-3 px-6 py-5 sm:px-10">
                    {auth.user ? (
                        <Link
                            href={dashboard()}
                            className="rounded-lg border border-white/40 bg-white/10 px-5 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
                        >
                            Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link
                                href={login()}
                                className="rounded-lg border border-white/30 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                            >
                                Log in
                            </Link>
                            {canRegister && (
                                <Link
                                    href={register()}
                                    className="rounded-lg border border-white/40 bg-white/10 px-5 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
                                >
                                    Register
                                </Link>
                            )}
                        </>
                    )}
                </header>

                {/* ── Centered Logo ── */}
                <main className="relative z-20 flex flex-1 flex-col items-center justify-center gap-6 text-center">
                    <div className='mt-60 sm:mt-96'>
                        <h1 className="text-4xl font-bold tracking-widest text-white drop-shadow-lg sm:text-5xl md:text-7xl">
                            HRIS
                        </h1>
                        <p className="mt-2 text-sm font-medium text-white/80">
                            Human Resource Information System
                        </p>
                    </div>
                </main>

                {/* ── Footer ── */}
                <footer className="relative z-20 py-4 text-center text-xs text-white/50">
                    © DARFO 5 - ICT UNIT {new Date().getFullYear()}
                </footer>
            </div>
        </>
    );
}