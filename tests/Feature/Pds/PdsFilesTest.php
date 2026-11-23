<?php

use App\Models\PdsGovernmentId;
use App\Services\PdsPdfService;
use App\Support\PdsFiles;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('local');
    Storage::fake('public');
});

test('path gives the absolute location on the private disk', function () {
    expect(PdsFiles::path('pds/1/sig.png'))->toBe(Storage::disk('local')->path('pds/1/sig.png'));
});

test('dataUri embeds a stored image', function () {
    Storage::disk('local')->put('pds/1/sig.png', 'not-really-a-png');

    expect(PdsFiles::dataUri('pds/1/sig.png'))->toStartWith('data:')->toContain(';base64,'.base64_encode('not-really-a-png'));
});

test('dataUri gives null for nothing stored or a missing file', function (?string $stored) {
    expect(PdsFiles::dataUri($stored))->toBeNull();
})->with([null, '', 'pds/1/missing.png']);

test('the PDS PDF reads the photo and signature from the private disk', function () {
    $user = pdsUser();
    Storage::disk('local')->put("pds/{$user->id}/photo.jpg", 'p');
    Storage::disk('local')->put("pds/{$user->id}/sig.png", 's');
    PdsGovernmentId::create([
        'user_id' => $user->id, 'id_type' => 'Passport', 'id_number' => 'P1', 'date_of_issuance' => '2022-01-15',
        'place_of_issuance' => 'DFA', 'date_accomplished' => '2026-11-18',
        'passport_photo' => "pds/{$user->id}/photo.jpg", 'signature' => "pds/{$user->id}/sig.png",
    ]);

    $html = app(PdsPdfService::class)->buildHtml($user);

    expect($html)->toContain(e(PdsFiles::path("pds/{$user->id}/photo.jpg")))
        ->and($html)->toContain(e(PdsFiles::path("pds/{$user->id}/sig.png")));
});
