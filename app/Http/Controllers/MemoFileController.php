<?php

namespace App\Http\Controllers;

use App\Models\Memo;
use App\Support\MemoFiles;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Serves a memo's file.
 *
 * The file is found from the memo row alone. Nothing in the request chooses a path, so there is no way to ask for another
 * memo's file or anything else on the private disk. Employees reach published memos only; HR reaches any memo that has a file.
 */
class MemoFileController extends Controller
{
    /** What each stored kind is served as. Anything not listed is only ever offered as a download. */
    private const KINDS = [
        'pdf' => ['application/pdf', 'inline'],
        'png' => ['image/png', 'inline'],
        'jpg' => ['image/jpeg', 'inline'],
        'jpeg' => ['image/jpeg', 'inline'],
        'doc' => ['application/msword', 'attachment'],
        'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'attachment'],
    ];

    public function show(Request $request, Memo $memo): StreamedResponse
    {
        Gate::authorize('viewAny', Memo::class);
        abort_unless(Memo::visibleTo($request->user())->whereKey($memo->id)->exists(), 404);

        $path = MemoFiles::fileOf($memo);
        abort_if($path === null, 404);

        [$type, $disposition] = self::KINDS[strtolower(pathinfo($path, PATHINFO_EXTENSION))] ?? ['application/octet-stream', 'attachment'];

        $name = str_replace(['/', '\\', '"'], '_', (string) ($memo->file_name ?: basename($path)));

        return MemoFiles::disk()->response($path, $name, [
            'Content-Type' => $type,
            'X-Content-Type-Options' => 'nosniff',
        ], $disposition);
    }
}
