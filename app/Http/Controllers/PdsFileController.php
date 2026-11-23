<?php

namespace App\Http\Controllers;

use App\Support\PdsFiles;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PdsFileController extends Controller
{
    /**
     * Serve one PDS upload. Only "pds/{userId}/..." paths exist here; the owner and HR/superadmin may open them.
     */
    public function show(Request $request): StreamedResponse
    {
        $path = $request->query('path');

        abort_unless(is_string($path) && $this->isPdsPath($path), 404);

        $ownerId = (int) explode('/', $path)[1];
        $user = $request->user();

        abort_unless($user->id === $ownerId || $user->hasAnyRole(['admin', 'superadmin']), 403);
        abort_unless(PdsFiles::disk()->exists($path), 404);

        $response = PdsFiles::disk()->response($path);
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        return $response;
    }

    /** "pds/{numeric id}/..." made only of plain file-name segments: no "." or ".." segment, no empty segment. */
    private function isPdsPath(string $path): bool
    {
        if (! preg_match('#^pds/\d+/[A-Za-z0-9._-]+(?:/[A-Za-z0-9._-]+)*$#', $path)) {
            return false;
        }

        foreach (explode('/', $path) as $segment) {
            if ($segment === '.' || $segment === '..') {
                return false;
            }
        }

        return true;
    }
}
