<?php

use App\Models\Signatory;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

// The saved list HR picks memo signatories from: name, position and an optional signature picture (kept private).

function signatoryPayload(array $overrides = []): array
{
    return array_merge(['name' => 'Maria Reyes Santos', 'position' => 'Regional Executive Director'], $overrides);
}

test('a guest is sent to login and an employee is refused on every signatory route', function () {
    $signatory = makeSignatory();
    $routes = [
        ['get', '/admin/memos/signatories'],
        ['post', '/admin/memos/signatories'],
        ['put', "/admin/memos/signatories/{$signatory->id}"],
        ['delete', "/admin/memos/signatories/{$signatory->id}"],
        ['get', "/admin/memos/signatories/{$signatory->id}/signature"],
    ];

    foreach ($routes as [$method, $uri]) {
        $this->{$method}($uri)->assertRedirect('/login');
    }

    $employee = memoAdmin('employee');
    foreach ($routes as [$method, $uri]) {
        $this->actingAs($employee)->{$method}($uri)->assertForbidden();
    }
});

test('admins and superadmins can add a signatory with a picture, kept on the private disk', function (string $role) {
    $this->actingAs(memoAdmin($role))
        ->post('/admin/memos/signatories', signatoryPayload(['signature' => UploadedFile::fake()->image('signature.png', 300, 100)]))
        ->assertSessionHasNoErrors();

    $signatory = Signatory::firstOrFail();
    expect($signatory->name)->toBe('Maria Reyes Santos')
        ->and($signatory->is_active)->toBeTrue()
        ->and($signatory->signature_path)->toStartWith("memos/signatories/{$signatory->id}/");
    Storage::disk('local')->assertExists($signatory->signature_path);
    Storage::disk('public')->assertMissing($signatory->signature_path);
})->with(['admin', 'superadmin']);

test('the name and position follow the limits and the person-name format, in plain words', function () {
    $admin = memoAdmin();

    $this->actingAs($admin)->post('/admin/memos/signatories', signatoryPayload(['name' => str_repeat('A', 101)]))
        ->assertSessionHasErrors(['name' => 'Name is too long (maximum 100 characters).']);
    $this->actingAs($admin)->post('/admin/memos/signatories', signatoryPayload(['position' => str_repeat('P', 101)]))
        ->assertSessionHasErrors(['position' => 'Position is too long (maximum 100 characters).']);
    $this->actingAs($admin)->post('/admin/memos/signatories', signatoryPayload(['name' => 'Maria 123']))
        ->assertSessionHasErrors('name');
    $this->actingAs($admin)->post('/admin/memos/signatories', ['name' => '', 'position' => ''])
        ->assertSessionHasErrors(['name' => 'Name is required.', 'position' => 'Position is required.']);

    expect(Signatory::count())->toBe(0);
});

test('a picture the server could not receive says so and names the real limit', function () {
    $this->actingAs(memoAdmin())
        ->post('/admin/memos/signatories', signatoryPayload(['signature' => memoRefusedUpload('signature.png', 'image/png')]))
        ->assertSessionHasErrors('signature');

    expect(session('errors')->first('signature'))->toContain('could not be uploaded')->toContain('MB each');
});

test('a picture over 2 MB, or one that is not a PNG or JPG, is refused', function () {
    $admin = memoAdmin();

    $this->actingAs($admin)->post('/admin/memos/signatories', signatoryPayload(['signature' => UploadedFile::fake()->image('big.png')->size(2049)]))
        ->assertSessionHasErrors(['signature' => 'The signature picture must not be larger than 2 MB.']);
    $this->actingAs($admin)->post('/admin/memos/signatories', signatoryPayload(['signature' => UploadedFile::fake()->create('signature.pdf', 10, 'application/pdf')]))
        ->assertSessionHasErrors(['signature' => 'The signature must be a PNG or JPG picture.']);

    expect(Signatory::count())->toBe(0);
});

test('replacing or removing a picture deletes the old file', function () {
    $admin = memoAdmin();
    $this->actingAs($admin)->post('/admin/memos/signatories', signatoryPayload(['signature' => UploadedFile::fake()->image('one.png')]));
    $signatory = Signatory::firstOrFail();
    $first = $signatory->signature_path;

    $this->actingAs($admin)->put("/admin/memos/signatories/{$signatory->id}", signatoryPayload(['signature' => UploadedFile::fake()->image('two.png')]))
        ->assertSessionHasNoErrors();
    $second = $signatory->fresh()->signature_path;
    expect($second)->not->toBe($first);
    Storage::disk('local')->assertMissing($first);
    Storage::disk('local')->assertExists($second);

    $this->actingAs($admin)->put("/admin/memos/signatories/{$signatory->id}", signatoryPayload(['remove_signature' => true]))
        ->assertSessionHasNoErrors();
    expect($signatory->fresh()->signature_path)->toBeNull();
    Storage::disk('local')->assertMissing($second);
});

test('delete deactivates and keeps the row; update can bring it back', function () {
    $admin = memoAdmin();
    $signatory = makeSignatory();

    $this->actingAs($admin)->delete("/admin/memos/signatories/{$signatory->id}")->assertRedirect();
    expect(Signatory::find($signatory->id))->not->toBeNull()
        ->and(Signatory::find($signatory->id)->is_active)->toBeFalse();

    $this->actingAs($admin)->put("/admin/memos/signatories/{$signatory->id}", signatoryPayload(['is_active' => true]))->assertSessionHasNoErrors();
    expect(Signatory::find($signatory->id)->is_active)->toBeTrue();
});

test('the signature route serves the picture to admins and is a 404 when there is none', function () {
    $admin = memoAdmin();
    $this->actingAs($admin)->post('/admin/memos/signatories', signatoryPayload(['signature' => UploadedFile::fake()->image('signature.png', 200, 80)]));
    $with = Signatory::firstOrFail();
    $without = makeSignatory(['name' => 'Juan Dela Cruz']);

    $response = $this->actingAs($admin)->get("/admin/memos/signatories/{$with->id}/signature")->assertOk();
    expect($response->headers->get('X-Content-Type-Options'))->toBe('nosniff')
        ->and($response->headers->get('Content-Type'))->toStartWith('image/');

    $this->actingAs($admin)->get("/admin/memos/signatories/{$without->id}/signature")->assertNotFound();
});

test('the page lists active and inactive signatories with a picture address only where there is one', function () {
    $admin = memoAdmin();
    $this->actingAs($admin)->post('/admin/memos/signatories', signatoryPayload(['signature' => UploadedFile::fake()->image('signature.png')]));
    $with = Signatory::firstOrFail();
    $without = makeSignatory(['name' => 'Juan Dela Cruz', 'is_active' => false]);

    $this->actingAs($admin)->get('/admin/memos/signatories')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Memos/Signatories/Index')
            ->has('signatories', 2)
            ->where('signatories', fn ($rows) => collect($rows)->firstWhere('id', $with->id)['signature_url'] === "/admin/memos/signatories/{$with->id}/signature"
                && collect($rows)->firstWhere('id', $without->id)['signature_url'] === null
                && collect($rows)->firstWhere('id', $without->id)['is_active'] === false)
            ->where('limits.name', 100)
            ->where('limits.position', 100));
});
