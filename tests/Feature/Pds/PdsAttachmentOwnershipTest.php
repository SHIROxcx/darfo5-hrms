<?php

use Illuminate\Support\Facades\Storage;

// A PDS row may keep an attachment only if it is already attached to one of that employee's own rows. The path is
// posted by the browser, so without this an employee could point a row at another employee's file, and the old-file
// cleanup would then delete it from disk.

function pdsKeepAttachmentPost($test, string $label, $user, array $existing)
{
    $payload = pdsSectionPayload(pdsAttachmentRoute($label));
    $payload['existing_attachments'] = $existing;

    return $test->actingAs($user)->post('/pds/save/'.pdsAttachmentRoute($label), $payload);
}

beforeEach(fn () => Storage::fake('local'));

test('keeps the employee\'s own attachment', function (string $label) {
    [$model, $folder] = pdsAttachmentSections()[$label];
    $user = pdsUser();
    $path = "pds/{$user->id}/{$folder}/mine.pdf";
    Storage::disk('local')->put($path, 'x');
    pdsAttachedRow($label, $user->id, $path);

    pdsKeepAttachmentPost($this, $label, $user, [$path])->assertSessionHasNoErrors();

    Storage::disk('local')->assertExists($path);
    expect($model::where('user_id', $user->id)->value('attachment'))->toBe($path);
})->with('pds attachment sections');

test('rejects another employee\'s attachment and leaves that file alone', function (string $label) {
    [$model, $folder] = pdsAttachmentSections()[$label];
    $victim = pdsUser();
    $attacker = pdsUser();
    $victimPath = "pds/{$victim->id}/{$folder}/secret.pdf";
    Storage::disk('local')->put($victimPath, 'secret');

    pdsKeepAttachmentPost($this, $label, $attacker, [$victimPath])->assertSessionHasErrors('existing_attachments.0');

    Storage::disk('local')->assertExists($victimPath);
    expect($model::where('attachment', $victimPath)->exists())->toBeFalse();
})->with('pds attachment sections');

test('rejects a path that climbs into another employee\'s folder', function (string $label) {
    [, $folder] = pdsAttachmentSections()[$label];
    $victim = pdsUser();
    $attacker = pdsUser();
    $victimPath = "pds/{$victim->id}/{$folder}/secret.pdf";
    Storage::disk('local')->put($victimPath, 'secret');
    $climbing = "pds/{$attacker->id}/../{$victim->id}/{$folder}/secret.pdf";

    pdsKeepAttachmentPost($this, $label, $attacker, [$climbing])->assertSessionHasErrors('existing_attachments.0');

    Storage::disk('local')->assertExists($victimPath);
})->with('pds attachment sections');

test('rejects a file in the employee\'s own folder that is not attached to one of their rows', function (string $label) {
    [, $folder] = pdsAttachmentSections()[$label];
    $user = pdsUser();
    $stray = "pds/{$user->id}/{$folder}/stray.pdf";
    Storage::disk('local')->put($stray, 'x');

    pdsKeepAttachmentPost($this, $label, $user, [$stray])->assertSessionHasErrors('existing_attachments.0');
})->with('pds attachment sections');

test('a rejected save leaves the employee\'s saved rows and files untouched', function (string $label) {
    [$model, $folder] = pdsAttachmentSections()[$label];
    $user = pdsUser();
    $victim = pdsUser();
    $own = "pds/{$user->id}/{$folder}/mine.pdf";
    Storage::disk('local')->put($own, 'x');
    pdsAttachedRow($label, $user->id, $own);

    pdsKeepAttachmentPost($this, $label, $user, ["pds/{$victim->id}/{$folder}/secret.pdf"])
        ->assertSessionHasErrors('existing_attachments.0');

    expect($model::where('user_id', $user->id)->pluck('attachment')->all())->toBe([$own]);
    Storage::disk('local')->assertExists($own);
})->with('pds attachment sections');
