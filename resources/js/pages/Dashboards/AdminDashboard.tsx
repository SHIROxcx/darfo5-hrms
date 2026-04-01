import AppLayout from "@/layouts/app-layout";
import { Head, router } from '@inertiajs/react';
import {
    Users, ShieldCheck, Briefcase, SquareUserRound,
    Megaphone, Zap, ChevronRight, Plus, X,
    Paperclip, Trash2, ExternalLink, FileText, Image, File,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';

// Types

interface AttachmentFile { path: string; url: string; name: string; }

interface Announcement {
    id: number;
    title: string;
    body: string;
    date: string;
    tag: string;
    tagColor: string;
    attachments: AttachmentFile[];
    auto_delete: boolean;
    delete_after: string | null;
}

interface Props {
    user: { name: string; email: string; roles: string[]; };
    stats: { total: number; permanent: number; job_order: number; cos: number; };
    announcements: Announcement[];
}

// Greeting

const MORNING_GREETINGS   = ['Good morning','Rise and shine','Starting the day strong','A wonderful morning to you','Great morning to see you'];
const AFTERNOON_GREETINGS = ['Afternoon','Good afternoon','Enjoy the rest of your day','A bright afternoon to you',"You're doing great today",'Halfway through the day'];
const EVENING_GREETINGS   = ['Evening','Hey, good evening!','Good evening','Great job today','Almost time to rest',"How's your shift going?",'Good to see you this evening','Great work today','Wrapping up for the day','Winding down for the evening'];

function getGreeting(): { text: string; emoji: string } {
    const now = new Date(); const hour = now.getHours();
    const pool = hour < 12 ? MORNING_GREETINGS : hour < 18 ? AFTERNOON_GREETINGS : EVENING_GREETINGS;
    const emoji  = hour < 12 ? '⛅' : hour < 18 ? '🌤️' : '🌙';
    return { text: pool[now.getTime() % pool.length], emoji };
}

const TAGS     = ['Reminder', 'Policy', 'Health', 'Holiday', 'General'];
const MAX_BODY = 200;
const PREVIEW  = 3;

const TAG_COLOR_MAP: Record<string, string> = {
    Reminder: 'bg-yellow-50 text-yellow-600',
    Policy:   'bg-blue-50 text-blue-600',
    Health:   'bg-green-50 text-green-600',
    Holiday:  'bg-red-50 text-red-600',
    General:  'bg-gray-50 text-gray-600',
};

// Helpers

function fileIcon(name: string) {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    if (['jpg','jpeg','png','gif','webp'].includes(ext)) return <Image className="h-4 w-4" />;
    if (ext === 'pdf') return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
}

// Sub-components

function ScoreCard({ label, value, icon, color, bg }: { label: string; value: number; icon: React.ReactNode; color: string; bg: string }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 border border-green-200 ${bg}`}>
                <div className={color}>{icon}</div>
            </div>
            <div>
                <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
                <p className="text-sm text-gray-500">{label}</p>
            </div>
        </div>
    );
}

function QuickActionItem({ label, href }: { label: string; href: string }) {
    return (
        <a href={href} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 hover:bg-green-50 hover:border-green-600 text-gray-700 hover:text-green-700 transition group">
            <div className="flex items-center gap-3 text-sm font-medium"><Zap className="h-4 w-4" />{label}</div>
            <ChevronRight className="h-4 w-4 transition" />
        </a>
    );
}

// Announcement list item

function AnnouncementItem({
    id, title, date, tag, tagColor, attachments,
    onView, onEdit, onDelete,
}: Omit<Announcement, 'body' | 'auto_delete' | 'delete_after'> & {
    onView: (id: number) => void;
    onEdit: (id: number) => void;
    onDelete: (id: number, title: string) => void;
}) {
    const parsed  = new Date(date);
    const dayNum  = parsed.toLocaleDateString('en-US', { day: '2-digit' });
    const dayAbbr = parsed.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

    return (
        <li className="relative group py-3 border-b border-gray-100 last:border-0 px-4">
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                <button onClick={() => onEdit(id)}
                    className="p-1 bg-green-50 border border-green-200 text-green-600 rounded-md hover:bg-green-700 hover:text-white transition" title="Edit">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>
                    </svg>
                </button>
                <button onClick={() => onDelete(id, title)}
                    className="p-1 bg-orange-50 border border-orange-200 text-orange-600 rounded-md hover:bg-orange-600 hover:text-white transition" title="Delete">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            </div>

            <div className="flex items-start gap-3 cursor-pointer" onClick={() => onView(id)}>
                <div className="shrink-0 h-14 w-14 border rounded-lg inline-flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-700 leading-none">{dayNum}</span>
                    <span className="text-xs text-gray-500 mt-0.5">{dayAbbr}</span>
                </div>
                <div className="flex flex-col min-w-0 pr-12">
                    <p className="font-semibold text-green-700 leading-tight mb-1 text-sm">{title}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${tagColor}`}>{tag}</span>
                        <p className="text-xs text-gray-400">Posted: {date}</p>
                        {attachments.length > 0 && (
                            <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                <Paperclip className="h-3 w-3" />{attachments.length}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </li>
    );
}

// View Modal

function AnnouncementViewModal({ announcement, onClose, isAdmin, onEdit, onDelete }: {
    announcement: Announcement;
    onClose: () => void;
    isAdmin: boolean;
    onEdit: (id: number) => void;
    onDelete: (id: number, title: string) => void;
}) {
    const parsed  = new Date(announcement.date);
    const dayNum  = parsed.toLocaleDateString('en-US', { day: '2-digit' });
    const dayAbbr = parsed.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4 gap-4">
                    <div className="flex items-start gap-3">
                        <div className="shrink-0 h-14 w-14 border rounded-lg inline-flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold text-gray-700 leading-none">{dayNum}</span>
                            <span className="text-xs text-gray-500 mt-0.5">{dayAbbr}</span>
                        </div>
                        <div>
                            <h3 className="font-semibold text-green-800 text-base leading-snug">{announcement.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${announcement.tagColor}`}>{announcement.tag}</span>
                                <span className="text-xs text-gray-400">Posted: {announcement.date}</span>
                            </div>
                            {announcement.auto_delete && announcement.delete_after && (
                                <p className="text-[10px] text-orange-500 mt-1">Auto-deletes on {announcement.delete_after}</p>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="cursor-pointer text-gray-400 hover:text-gray-600 transition shrink-0">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Description</p>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{announcement.body}</p>
                    </div>

                    {announcement.attachments.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                                <Paperclip className="h-3 w-3" /> Attachments
                            </p>
                            <div className="space-y-1.5">
                                {announcement.attachments.map((f, i) => (
                                    <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-green-400 hover:bg-green-50 transition text-sm text-gray-700 group">
                                        <span className="text-green-600 shrink-0">{fileIcon(f.name)}</span>
                                        <span className="truncate flex-1">{f.name}</span>
                                        <ExternalLink className="h-3.5 w-3.5 text-gray-400 group-hover:text-green-600 shrink-0" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {isAdmin && (
                    <div className="flex justify-end gap-2 border-t px-6 py-4">
                        <button onClick={() => { onClose(); onDelete(announcement.id, announcement.title); }}
                            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-600 hover:bg-orange-100 transition">
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                        <button onClick={() => { onClose(); onEdit(announcement.id); }}
                            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 transition">
                            Edit Announcement
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// Post / Edit Modal

interface ModalProps {
    editing?: Announcement;
    onClose: () => void;
    onSaved: (a: Announcement) => void;
}

function AnnouncementModal({ editing, onClose, onSaved }: ModalProps) {
    const isEdit = editing !== undefined;

    const [title,        setTitle]        = useState(editing?.title  ?? '');
    const [body,         setBody]         = useState(editing?.body   ?? '');
    // Announcement date
    const [date, setDate] = useState(
        editing?.date
            ? (() => {
                const d = new Date(editing.date);
                const offset = d.getTimezoneOffset() * 60000;
                return new Date(d.getTime() - offset).toISOString().slice(0, 10);
            })()
            : ''
    );
    const [tag,          setTag]          = useState(editing?.tag ?? 'General');
    const [files,        setFiles]        = useState<File[]>([]);
    const [removedPaths, setRemovedPaths] = useState<string[]>([]);
    const [autoDelete,   setAutoDelete]   = useState(editing?.auto_delete ?? false);
    const [deleteAfter, setDeleteAfter] = useState(
        editing?.delete_after
            ? (() => {
                const d = new Date(editing.delete_after!);
                const offset = d.getTimezoneOffset() * 60000;
                return new Date(d.getTime() - offset).toISOString().slice(0, 10);
            })()
            : ''
    );
    const [saving,  setSaving]  = useState(false);
    const [errors,  setErrors]  = useState<Record<string, string>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    const bodyLeft            = MAX_BODY - body.length;
    const inputCls            = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600';
    const existingAttachments = (editing?.attachments ?? []).filter(a => !removedPaths.includes(a.path));

    function validate() {
        const e: Record<string, string> = {};
        if (!title.trim())              e.title       = 'Title is required.';
        if (!body.trim())               e.body        = 'Description is required.';
        if (body.length > MAX_BODY)     e.body        = `Max ${MAX_BODY} characters.`;
        if (!date)                      e.date        = 'Date is required.';
        if (autoDelete && !deleteAfter) e.deleteAfter = 'Please specify the delete-after date.';
        return e;
    }

    function removeExistingAttachment(path: string) { setRemovedPaths(prev => [...prev, path]); }
    function removeNewFile(i: number)               { setFiles(prev => prev.filter((_, idx) => idx !== i)); }

    function handleSubmit() {
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); return; }
        setSaving(true);

        const formData = new FormData();
        formData.append('title', title);
        formData.append('body',  body);
        formData.append('date',  date);
        formData.append('tag',   tag);
        formData.append('auto_delete', autoDelete ? '1' : '0');
        if (autoDelete && deleteAfter) formData.append('delete_after', deleteAfter);
        files.forEach(f => formData.append('attachments[]', f));
        if (isEdit && removedPaths.length) formData.append('removed_attachments', JSON.stringify(removedPaths));
        if (isEdit) formData.append('_method', 'PUT');

        const url = isEdit ? `/announcements/${editing!.id}` : '/announcements';

        router.post(url, formData, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                setSaving(false);
                onClose();
                router.reload({ only: ['announcements'] });
            },
            onError: (errs) => {
                setErrors(errs as Record<string, string>);
                setSaving(false);
            },
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl flex flex-col max-h-[92vh]">

                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0">
                    <h3 className="font-semibold text-green-800 text-sm">{isEdit ? 'Edit Announcement' : 'Post Announcement'}</h3>
                    <button onClick={onClose} className="cursor-pointer text-gray-400 hover:text-gray-600 transition"><X className="h-5 w-5" /></button>
                </div>

                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

                    {/* Title */}
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Title</label>
                        <input value={title} onChange={e => { setTitle(e.target.value); setErrors(p => ({ ...p, title: '' })); }}
                            className={inputCls} placeholder="e.g. Submission of IPCR for Q1 2026" />
                        {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="mb-1 flex items-center justify-between text-xs font-medium text-gray-500">
                            <span>Description</span>
                            <span className={bodyLeft < 20 ? 'text-red-500 font-semibold' : bodyLeft < 50 ? 'text-yellow-500' : 'text-gray-400'}>{bodyLeft} / {MAX_BODY}</span>
                        </label>
                        <textarea value={body} onChange={e => { setBody(e.target.value.slice(0, MAX_BODY)); setErrors(p => ({ ...p, body: '' })); }}
                            rows={3} className={`${inputCls} resize-none`} placeholder="Brief description of the announcement" />
                        {errors.body && <p className="mt-1 text-xs text-red-500">{errors.body}</p>}
                    </div>

                    {/* Date + Tag */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Announcement Date</label>
                            <input type="date" value={date} onChange={e => { setDate(e.target.value); setErrors(p => ({ ...p, date: '' })); }} className={inputCls} />
                            {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Category</label>
                            <select value={tag} onChange={e => setTag(e.target.value)} className={inputCls}>
                                {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Attachments */}
                    <div>
                        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-500">
                            <Paperclip className="h-3.5 w-3.5" /> Attachments
                            <span className="text-gray-400 font-normal">(PDF, images, docs — max 10MB each)</span>
                        </label>

                        {existingAttachments.length > 0 && (
                            <div className="mb-2 space-y-1">
                                {existingAttachments.map((f, i) => (
                                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-700">
                                        <span className="text-green-600">{fileIcon(f.name)}</span>
                                        <span className="truncate flex-1">{f.name}</span>
                                        <button onClick={() => removeExistingAttachment(f.path)}
                                            className="text-red-400 hover:text-red-600 transition shrink-0"><X className="h-3.5 w-3.5" /></button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {files.length > 0 && (
                            <div className="mb-2 space-y-1">
                                {files.map((f, i) => (
                                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-xs text-gray-700">
                                        <span className="text-green-600">{fileIcon(f.name)}</span>
                                        <span className="truncate flex-1">{f.name}</span>
                                        <button onClick={() => removeNewFile(i)}
                                            className="text-red-400 hover:text-red-600 transition shrink-0"><X className="h-3.5 w-3.5" /></button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button type="button" onClick={() => fileInputRef.current?.click()}
                            className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-xs text-gray-500 hover:border-green-400 hover:text-green-600 transition w-full justify-center">
                            <Plus className="h-3.5 w-3.5" /> Add file
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.zip"
                            onChange={e => {
                                const picked = e.target.files ? Array.from(e.target.files) : [];
                                e.target.value = '';
                                if (picked.length) setFiles(prev => [...prev, ...picked]);
                            }}
                        />
                    </div>

                    {/* Auto-delete */}
                    <div className="rounded-lg border border-gray-200 px-4 py-3 space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" checked={autoDelete}
                                onChange={e => { setAutoDelete(e.target.checked); if (!e.target.checked) setDeleteAfter(''); }}
                                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer" />
                            <span className="text-xs font-medium text-gray-700">Auto-delete after specified date</span>
                        </label>
                        {autoDelete && (
                            <div>
                                <input type="date" value={deleteAfter} min={date || undefined}
                                    onChange={e => { setDeleteAfter(e.target.value); setErrors(p => ({ ...p, deleteAfter: '' })); }}
                                    className={inputCls} />
                                {errors.deleteAfter && <p className="mt-1 text-xs text-red-500">{errors.deleteAfter}</p>}
                                <p className="mt-1 text-[10px] text-orange-500">The announcement will be automatically removed on this date.</p>
                            </div>
                        )}
                    </div>

                </div>

                <div className="flex justify-end gap-2 border-t px-6 py-4 shrink-0">
                    <button onClick={onClose}
                        className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={saving}
                        className="flex cursor-pointer items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-60">
                        {saving ? (
                            <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                            </svg>{isEdit ? 'Saving…' : 'Posting…'}</>
                        ) : (isEdit ? 'Save Changes' : 'Post Announcement')}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Main Dashboard

export default function AdminDashboard({ user, stats, announcements: initialAnnouncements }: Props) {
    const firstName = user.name.split(' ')[0];
    const { text: greeting, emoji } = getGreeting();
    const timeString = new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements ?? []);
    const [showModal,     setShowModal]     = useState(false);
    const [editing,       setEditing]       = useState<Announcement | undefined>(undefined);
    const [viewing,       setViewing]       = useState<Announcement | undefined>(undefined);
    const [expanded,      setExpanded]      = useState(false);

    const hasMore = announcements.length > PREVIEW;
    const visible = expanded ? announcements : announcements.slice(0, PREVIEW);

    function openCreate() { setEditing(undefined); setShowModal(true); }

    function handleView(id: number) {
        const found = announcements.find(a => a.id === id);
        if (found) setViewing(found);
    }

    function handleEdit(id: number) {
        const found = announcements.find(a => a.id === id);
        if (found) { setViewing(undefined); setEditing(found); setShowModal(true); }
    }

    function handleSaved(updated: Announcement) {
        setAnnouncements(prev => {
            const exists = prev.some(a => a.id === updated.id);
            return exists ? prev.map(a => a.id === updated.id ? updated : a) : [updated, ...prev];
        });
    }

    function handleDelete(id: number, title: string) {
        setViewing(undefined);
        Swal.fire({
            title: 'Are you sure?',
            html: `You are about to delete: <strong>${title}</strong>.`,
            icon: 'warning', showCancelButton: true,
            confirmButtonColor: '#16a34a', cancelButtonColor: '#d33', confirmButtonText: 'Yes, delete it!',
        }).then(result => {
            if (!result.isConfirmed) return;
            router.delete(`/announcements/${id}`, {
                preserveScroll: true,
                onSuccess: () => setAnnouncements(prev => prev.filter(a => a.id !== id)),
            });
        });
    }

    useEffect(() => {
        function onNew(e: Event) {
            const a = (e as CustomEvent<Announcement>).detail;
            setAnnouncements(prev => prev.some(x => x.id === a.id) ? prev : [a, ...prev]);
        }
        function onDeleted(e: Event) {
            const { id } = (e as CustomEvent<{ id: number }>).detail;
            setAnnouncements(prev => prev.filter(a => a.id !== id));
        }
        function onUpdated(e: Event) {
            const updated = (e as CustomEvent<Announcement>).detail;
            setAnnouncements(prev =>
                prev.map(a => a.id === updated.id ? updated : a)
            );
        }

        window.addEventListener('announcement:new', onNew);
        window.addEventListener('announcement:deleted', onDeleted);
        window.addEventListener('announcement:updated', onUpdated);

        return () => {
            window.removeEventListener('announcement:new', onNew);
            window.removeEventListener('announcement:deleted', onDeleted);
            window.removeEventListener('announcement:updated', onUpdated);
        };
    }, []);

    useEffect(() => {
        if (window.location.hash === '#announcements-panel') {
            setTimeout(() => {
                const el = document.getElementById('announcements-panel');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
        }
    }, []);

    return (
        <AppLayout>
            <Head title="HR Admin Dashboard" />

            {viewing && (
                <AnnouncementViewModal
                    announcement={viewing}
                    onClose={() => setViewing(undefined)}
                    isAdmin={true}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            )}

            {showModal && (
                <AnnouncementModal
                    editing={editing}
                    onClose={() => { setShowModal(false); setEditing(undefined); }}
                    onSaved={handleSaved}
                />
            )}

            <div className="py-6 px-4 sm:px-6 lg:px-8 w-full mx-auto">
                <div className="mb-8">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                        <span className="text-green-700">{greeting}, </span>
                        <span className="text-orange-500">{firstName}!</span>
                    </h1>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5"><span>{emoji}</span><span>{timeString}</span></p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <ScoreCard label="Total Employees"       value={stats.total}     icon={<Users className="h-6 w-6" />}          color="text-green-600" bg="bg-green-50" />
                            <ScoreCard label="Permanent Employees"   value={stats.permanent} icon={<ShieldCheck className="h-6 w-6" />}    color="text-green-600" bg="bg-green-50" />
                            <ScoreCard label="Job Order Employees"   value={stats.job_order} icon={<Briefcase className="h-6 w-6" />}      color="text-green-600" bg="bg-green-50" />
                            <ScoreCard label="Contractual Employees" value={stats.cos}       icon={<SquareUserRound className="h-6 w-6" />} color="text-green-600" bg="bg-green-50" />
                        </div>
                        <div>
                            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3 ml-3">Quick Actions</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <QuickActionItem label="Manage Employees" href="/admin/employees" />
                                <QuickActionItem label="Leave Requests"   href="/admin/leave" />
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1" id="announcements-panel">
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
                            <div className="px-5 py-4 border-b flex items-center justify-between bg-gray-50">
                                <div className="flex items-center gap-2">
                                    <Megaphone className="h-4 w-4 text-green-700" />
                                    <h2 className="text-sm font-semibold text-green-800">Announcements</h2>
                                    {announcements.length > 0 && (
                                        <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">{announcements.length}</span>
                                    )}
                                </div>
                                <button onClick={openCreate} title="Post new announcement"
                                    className="flex cursor-pointer items-center justify-center h-7 w-7 text-green-700 hover:text-green-900 transition">
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>

                            <ul>
                                {announcements.length === 0 ? (
                                    <li className="px-5 py-8 text-center text-xs text-gray-400 italic">No announcements posted.</li>
                                ) : (
                                    visible.map(item => (
                                        <AnnouncementItem
                                            key={item.id}
                                            id={item.id}
                                            title={item.title}
                                            date={item.date}
                                            tag={item.tag}
                                            tagColor={item.tagColor}
                                            attachments={item.attachments}
                                            onView={handleView}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                        />
                                    ))
                                )}
                            </ul>

                            {hasMore && (
                                <div className="px-5 py-3 border-t text-center">
                                    <button onClick={() => setExpanded(prev => !prev)}
                                        className="text-xs text-green-700 font-medium hover:underline transition">
                                        {expanded ? 'Show less' : `View all ${announcements.length} announcements`}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}