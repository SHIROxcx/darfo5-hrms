<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSignatoryRequest;
use App\Http\Requests\Admin\UpdateSignatoryRequest;
use App\Models\Signatory;
use App\Support\MemoFiles;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/** The saved list of people who may sign memos. */
class SignatoryController extends Controller
{
    public function index(): Response
    {
        $signatories = Signatory::query()
            ->orderByDesc('is_active')
            ->orderBy('name')
            ->get()
            ->map(fn (Signatory $signatory) => [
                'id' => $signatory->id,
                'name' => $signatory->name,
                'position' => $signatory->position,
                'is_active' => $signatory->is_active,
                'signature_url' => $signatory->signature_path
                    ? route('admin.signatories.signature', $signatory, absolute: false)
                    : null,
            ]);

        return Inertia::render('Admin/Memos/Signatories/Index', [
            'signatories' => $signatories,
            'limits' => [
                'name' => config('memos.limits.name'),
                'position' => config('memos.limits.position'),
            ],
        ]);
    }

    public function store(StoreSignatoryRequest $request): RedirectResponse
    {
        $signatory = Signatory::create($request->safe()->only(['name', 'position']));

        if ($request->hasFile('signature')) {
            $this->storePicture($signatory, $request->file('signature'));
        }

        return back()->with('success', 'Signatory added.');
    }

    public function update(UpdateSignatoryRequest $request, Signatory $signatory): RedirectResponse
    {
        $data = $request->safe()->only(['name', 'position']);

        if ($request->has('is_active')) {
            $data['is_active'] = $request->boolean('is_active');
        }

        $signatory->update($data);

        if ($request->hasFile('signature')) {
            $this->storePicture($signatory, $request->file('signature'));
        } elseif ($request->boolean('remove_signature')) {
            $this->removePicture($signatory);
        }

        return back()->with('success', 'Signatory updated.');
    }

    /** A signatory is never deleted (issued memos refer to them); it is deactivated and no longer offered for new memos. */
    public function destroy(Signatory $signatory): RedirectResponse
    {
        $signatory->update(['is_active' => false]);

        return back()->with('success', 'Signatory deactivated.');
    }

    /** The saved picture, for the admin page's preview. Private: never cached, never reachable without a login. */
    public function signature(Signatory $signatory): StreamedResponse
    {
        abort_unless($signatory->signature_path && MemoFiles::disk()->exists($signatory->signature_path), 404);

        return Storage::disk(MemoFiles::DISK)->response($signatory->signature_path, null, [
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store',
        ]);
    }

    private function storePicture(Signatory $signatory, UploadedFile $file): void
    {
        if ($signatory->signature_path) {
            MemoFiles::disk()->delete($signatory->signature_path);
        }

        $signatory->update(['signature_path' => $file->store(MemoFiles::signatoryDir($signatory->id), MemoFiles::DISK)]);
    }

    private function removePicture(Signatory $signatory): void
    {
        if ($signatory->signature_path) {
            MemoFiles::disk()->delete($signatory->signature_path);
            $signatory->update(['signature_path' => null]);
        }
    }
}
