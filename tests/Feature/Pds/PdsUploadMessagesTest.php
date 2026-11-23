<?php

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

// PHP refuses a file bigger than its own upload_max_filesize (2 MB on a fresh WAMP install) before Laravel sees it, even though
// the forms say "Max 5 MB". The employee used to read "The Attachment #1 failed to upload.", which says nothing about what to do,
// and a refused photo or signature produced "references must be an array" instead of the real reason.

beforeEach(function () {
    Storage::fake('local');
    Storage::fake('public');
});

/** What PHP hands over for a file that is over its limit. */
function pdsRefusedUpload(string $name = 'scan.pdf', string $mime = 'application/pdf'): UploadedFile
{
    $path = tempnam(sys_get_temp_dir(), 'pds');
    file_put_contents($path, '%PDF-1.4');

    return new UploadedFile($path, $name, $mime, UPLOAD_ERR_INI_SIZE, true);
}

test('a certificate the server could not receive says so in plain words', function (string $label) {
    $section = pdsAttachmentRoute($label);
    $payload = pdsSectionPayload($section);
    $payload['attachments'] = [pdsRefusedUpload()];

    $this->actingAs(pdsUser())->post("/pds/save/{$section}", $payload)->assertSessionHasErrors('attachments.0');

    $message = session('errors')->first('attachments.0');
    expect($message)->toContain('could not be uploaded')->toContain('MB each')->not->toContain('failed to upload');
})->with('pds attachment sections');

test('a photo or signature the server could not receive says so, not that the references are missing', function (string $field) {
    $payload = pdsSectionPayload('references');
    $payload['references'] = json_encode($payload['references']);
    $payload[$field] = pdsRefusedUpload($field.'.png', 'image/png');

    $this->actingAs(pdsUser())->post('/pds/save/references', $payload)->assertSessionHasErrors($field);

    expect(session('errors')->first($field))->toContain('could not be uploaded')->toContain('MB each');
    expect(session('errors')->has('references'))->toBeFalse();
})->with(['passport_photo', 'signature']);
