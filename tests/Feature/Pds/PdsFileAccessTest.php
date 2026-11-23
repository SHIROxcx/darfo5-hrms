<?php

use App\Models\PdsGovernmentId;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

// PDS uploads (certificates, ID photo, e-signature) are personal data. They live on the private disk and are only
// reachable through GET /pds/file, which lets in the owner and HR/superadmin and nobody else.

beforeEach(function () {
    Storage::fake('local');
    Storage::fake('public');
});

function pdsFileGet($test, ?\App\Models\User $as, string $path)
{
    $test = $as ? $test->actingAs($as) : $test;

    return $test->get('/pds/file?'.http_build_query(['path' => $path]));
}

test('the owner can open their own file', function () {
    $owner = pdsUser();
    $path = "pds/{$owner->id}/work_experience/cert.pdf";
    Storage::disk('local')->put($path, 'certificate');

    $response = pdsFileGet($this, $owner, $path)->assertOk();

    expect($response->streamedContent())->toBe('certificate');
    expect($response->headers->get('X-Content-Type-Options'))->toBe('nosniff');
});

test('another employee cannot open the file', function () {
    $owner = pdsUser();
    $path = "pds/{$owner->id}/work_experience/cert.pdf";
    Storage::disk('local')->put($path, 'certificate');

    pdsFileGet($this, pdsUser(), $path)->assertForbidden();
});

test('HR and superadmin can open an employee\'s file', function (string $role) {
    $owner = pdsUser();
    $path = "pds/{$owner->id}/sig.png";
    Storage::disk('local')->put($path, 'signature');

    pdsFileGet($this, pdsUser($role), $path)->assertOk();
})->with(['admin', 'superadmin']);

test('a guest is sent to the login page', function () {
    $owner = pdsUser();
    $path = "pds/{$owner->id}/sig.png";
    Storage::disk('local')->put($path, 'signature');

    pdsFileGet($this, null, $path)->assertRedirect('/login');
});

test('a missing file is not found', function () {
    $owner = pdsUser();

    pdsFileGet($this, $owner, "pds/{$owner->id}/nothing.pdf")->assertNotFound();
});

test('a path that does not point inside a PDS folder is not found', function (string $path) {
    $owner = pdsUser();
    Storage::disk('local')->put('photos/avatar.jpg', 'x');
    Storage::disk('local')->put('pds/notanumber/x.pdf', 'x');

    pdsFileGet($this, $owner, $path)->assertNotFound();
})->with(['photos/avatar.jpg', '.env', '../.env', 'pds', 'pds/', 'pds/notanumber/x.pdf', '/pds/1/x.pdf']);

test('a path that climbs into another employee\'s folder is not found', function () {
    $victim = pdsUser();
    $attacker = pdsUser();
    Storage::disk('local')->put("pds/{$victim->id}/sig.png", 'secret');

    $response = pdsFileGet($this, $attacker, "pds/{$attacker->id}/../{$victim->id}/sig.png");

    $response->assertNotFound();
});

test('a missing or non-text path is not found', function () {
    $owner = pdsUser();

    $this->actingAs($owner)->get('/pds/file')->assertNotFound();
    $this->actingAs($owner)->get('/pds/file?path[]=a')->assertNotFound();
});

// Uploads go to the private disk.
test('attachments are stored on the private disk, not the public one', function (string $label) {
    [$model] = pdsAttachmentSections()[$label];
    $section = pdsAttachmentRoute($label);
    $user = pdsUser();
    $payload = pdsSectionPayload($section);
    $payload['attachments'] = [UploadedFile::fake()->create('cert.pdf', 10, 'application/pdf')];

    $this->actingAs($user)->post("/pds/save/{$section}", $payload)->assertSessionHasNoErrors();

    $path = $model::where('user_id', $user->id)->value('attachment');
    expect($path)->toStartWith("pds/{$user->id}/");
    Storage::disk('local')->assertExists($path);
    Storage::disk('public')->assertMissing($path);
})->with('pds attachment sections');

test('the passport photo and signature are stored on the private disk and replaced cleanly', function () {
    $user = pdsUser();
    $save = function () use ($user) {
        $payload = pdsSectionPayload('references');
        $payload['references'] = json_encode($payload['references']);
        $payload['passport_photo'] = UploadedFile::fake()->image('photo.jpg');
        $payload['signature'] = UploadedFile::fake()->image('sig.png');
        $this->actingAs($user)->post('/pds/save/references', $payload)->assertOk();

        return PdsGovernmentId::where('user_id', $user->id)->first();
    };

    $first = $save();
    foreach ([$first->passport_photo, $first->signature] as $path) {
        Storage::disk('local')->assertExists($path);
        Storage::disk('public')->assertMissing($path);
    }

    $second = $save();
    foreach ([$first->passport_photo, $first->signature] as $oldPath) {
        Storage::disk('local')->assertMissing($oldPath);
    }
    Storage::disk('local')->assertExists($second->passport_photo);
    Storage::disk('local')->assertExists($second->signature);
});

test('a file the employee drops from a row is deleted from the private disk', function (string $label) {
    [$model, $folder] = pdsAttachmentSections()[$label];
    $user = pdsUser();
    $path = "pds/{$user->id}/{$folder}/old.pdf";
    Storage::disk('local')->put($path, 'x');
    pdsAttachedRow($label, $user->id, $path);

    $section = pdsAttachmentRoute($label);
    $this->actingAs($user)->post("/pds/save/{$section}", pdsSectionPayload($section))->assertSessionHasNoErrors();

    Storage::disk('local')->assertMissing($path);
})->with('pds attachment sections');

// The signature pad on the References form produces a PNG with a transparent background, cropped to the ink, and sends it
// as an ordinary file called signature.png. The server needs nothing special, but the transparency must survive so the
// signature prints cleanly on the PDF.
test('a signature drawn on screen (a transparent PNG) is accepted and stored privately with its transparency', function () {
    $user = pdsUser();

    $image = imagecreatetruecolor(900, 300);
    imagealphablending($image, false);
    imagesavealpha($image, true);
    imagefill($image, 0, 0, imagecolorallocatealpha($image, 0, 0, 0, 127)); // fully transparent
    imagealphablending($image, true);
    imagesetthickness($image, 7);
    imageline($image, 40, 220, 300, 60, imagecolorallocate($image, 17, 17, 17));
    imageline($image, 300, 60, 520, 230, imagecolorallocate($image, 17, 17, 17));
    $path = tempnam(sys_get_temp_dir(), 'sig').'.png';
    imagepng($image, $path);

    $payload = pdsSectionPayload('references');
    $payload['references'] = json_encode($payload['references']);
    $payload['signature'] = new UploadedFile($path, 'signature.png', 'image/png', null, true);

    $this->actingAs($user)->post('/pds/save/references', $payload)->assertOk();

    $stored = PdsGovernmentId::where('user_id', $user->id)->value('signature');
    expect($stored)->toStartWith("pds/{$user->id}/");
    Storage::disk('local')->assertExists($stored);
    Storage::disk('public')->assertMissing($stored);

    $saved = imagecreatefromstring(Storage::disk('local')->get($stored));
    expect((imagecolorat($saved, 2, 2) >> 24) & 0x7F)->toBe(127); // the corner is still fully transparent
    @unlink($path);
});

// The pad (and the upload) send the picture as `signature`; the server is what keeps anything else out.
test('a signature must be a picture of at most 2 MB', function (string $problem) {
    $user = pdsUser();
    $payload = pdsSectionPayload('references');
    $payload['references'] = json_encode($payload['references']);
    $payload['signature'] = match ($problem) {
        'not a picture' => UploadedFile::fake()->create('signature.pdf', 10, 'application/pdf'),
        'over 2 MB' => UploadedFile::fake()->image('signature.png', 100, 100)->size(2049),
    };

    $this->actingAs($user)->post('/pds/save/references', $payload)->assertSessionHasErrors('signature');
    expect(PdsGovernmentId::where('user_id', $user->id)->value('signature'))->toBeNull();
})->with(['not a picture', 'over 2 MB']);

test('a signature of exactly 2 MB is accepted', function () {
    $payload = pdsSectionPayload('references');
    $payload['references'] = json_encode($payload['references']);
    $payload['signature'] = UploadedFile::fake()->image('signature.png', 100, 100)->size(2048);

    $this->actingAs(pdsUser())->post('/pds/save/references', $payload)->assertOk();
});

test('a passport photo must be a picture of at most 4 MB', function (string $problem) {
    $payload = pdsSectionPayload('references');
    $payload['references'] = json_encode($payload['references']);
    $payload['passport_photo'] = match ($problem) {
        'not a picture' => UploadedFile::fake()->create('photo.pdf', 10, 'application/pdf'),
        'over 4 MB' => UploadedFile::fake()->image('photo.jpg', 100, 100)->size(4097),
    };

    $this->actingAs(pdsUser())->post('/pds/save/references', $payload)->assertSessionHasErrors('passport_photo');
})->with(['not a picture', 'over 4 MB']);
