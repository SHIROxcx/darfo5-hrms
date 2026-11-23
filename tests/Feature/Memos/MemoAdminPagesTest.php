<?php

use App\Models\Memo;
use Illuminate\Http\UploadedFile;
use Inertia\Testing\AssertableInertia as Assert;

// The admin memo pages: the list, the create form and the edit form.

test('a guest is sent to login and an employee is refused on the memo pages', function () {
    $memo = Memo::factory()->create();
    $uris = ['/admin/memos', '/admin/memos/create', "/admin/memos/{$memo->id}/edit"];

    foreach ($uris as $uri) {
        $this->get($uri)->assertRedirect('/login');
    }

    $employee = memoAdmin('employee');
    foreach ($uris as $uri) {
        $this->actingAs($employee)->get($uri)->assertForbidden();
    }
});

test('the list shows memos newest first, 15 to a page, with the counts by status', function () {
    $admin = memoAdmin();
    foreach (range(1, 18) as $i) {
        Memo::factory()->create(['subject' => "Draft {$i}", 'memo_date' => now()->subDays(20 - $i)->toDateString()]);
    }
    $published = Memo::factory()->published()->create(['subject' => 'Published one', 'number' => 7, 'series_year' => 2026]);
    Memo::factory()->withdrawn()->create(['subject' => 'Withdrawn one']);

    $this->actingAs($admin)->get('/admin/memos')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Memos/Index')
            ->has('memos.data', 15)
            ->where('memos.total', 20)
            ->where('memos.data.0.subject', 'Withdrawn one')
            ->where('counts', ['draft' => 18, 'published' => 1, 'withdrawn' => 1])
            ->where('types', ['Memorandum', 'Memorandum Circular']));

    $this->actingAs($admin)->get('/admin/memos?status=published')
        ->assertInertia(fn (Assert $page) => $page
            ->has('memos.data', 1)
            ->where('memos.data.0', fn ($row) => $row['id'] === $published->id
                && $row['number_label'] === 'No. 7, Series of 2026'
                && $row['status'] === 'published'
                && $row['mode'] === 'written'
                && collect($row)->has('created_by_name'))
            ->where('filters.status', 'published'));
});

test('the list can be filtered by type and searched by subject', function () {
    $admin = memoAdmin();
    Memo::factory()->create(['subject' => 'Flag ceremony schedule', 'type' => 'Memorandum']);
    Memo::factory()->create(['subject' => 'Flag raising policy', 'type' => 'Memorandum Circular']);
    Memo::factory()->create(['subject' => 'Leave filing reminder', 'type' => 'Memorandum']);

    $this->actingAs($admin)->get('/admin/memos?search=Flag')
        ->assertInertia(fn (Assert $page) => $page->has('memos.data', 2)->where('filters.search', 'Flag'));

    $this->actingAs($admin)->get('/admin/memos?type=Memorandum Circular')
        ->assertInertia(fn (Assert $page) => $page->has('memos.data', 1)->where('memos.data.0.subject', 'Flag raising policy'));

    $this->actingAs($admin)->get('/admin/memos?search=Flag&type=Memorandum')
        ->assertInertia(fn (Assert $page) => $page->has('memos.data', 1)->where('memos.data.0.subject', 'Flag ceremony schedule'));
});

test('the create form gets the types, the active signatories and the defaults', function () {
    $admin = memoAdmin();
    $active = makeSignatory(['name' => 'Maria Santos', 'position' => 'Regional Executive Director']);
    makeSignatory(['name' => 'Retired Person', 'is_active' => false]);

    $this->actingAs($admin)->get('/admin/memos/create')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Memos/Create')
            ->where('types', ['Memorandum', 'Memorandum Circular'])
            ->has('signatories', 1)
            ->where('signatories.0', ['id' => $active->id, 'name' => 'Maria Santos', 'position' => 'Regional Executive Director', 'has_signature' => false])
            ->where('defaults', ['addressed_to' => 'All DA RFO 5 Employees', 'memo_date' => now('Asia/Manila')->toDateString()]));
});

test('saving a new draft goes on to its edit page', function () {
    $this->actingAs(memoAdmin())->post('/admin/memos', memoPayload())->assertSessionHasNoErrors();

    $memo = Memo::firstOrFail();
    $this->actingAs(memoAdmin())->post('/admin/memos', memoPayload(['subject' => 'Second']))
        ->assertRedirect(route('admin.memos.edit', Memo::latest('id')->first(), absolute: false));
    expect($memo->id)->toBeInt();
});

test('the edit form gets the draft as saved, and a published memo cannot be edited', function () {
    $admin = memoAdmin();
    $signatory = makeSignatory();
    $this->actingAs($admin)->post('/admin/memos', memoPayload([
        'mode' => 'uploaded',
        'reference' => 'MC 58',
        'file' => UploadedFile::fake()->create('circular.pdf', 50, 'application/pdf'),
        'signatories' => [['signatory_id' => $signatory->id, 'label' => 'Approved by']],
    ]));
    $draft = Memo::firstOrFail();

    $this->actingAs($admin)->get("/admin/memos/{$draft->id}/edit")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Memos/Edit')
            ->where('memo', [
                'id' => $draft->id,
                'type' => 'Memorandum',
                'subject' => 'Submission of IPCR for the first semester',
                'addressed_to' => 'All DA RFO 5 Employees',
                'memo_date' => '2026-11-21',
                'memo_time' => '14:30',
                'mode' => 'uploaded',
                'body' => null,
                'reference' => 'MC 58',
                'file_name' => 'circular.pdf',
                'signatories' => [['signatory_id' => $signatory->id, 'label' => 'Approved by']],
            ])
            ->has('signatories', 1)
            ->has('types', 2));

    $this->actingAs($admin)->get('/admin/memos/'.Memo::factory()->published()->create()->id.'/edit')->assertForbidden();

    $trashed = Memo::factory()->create();
    $trashed->delete();
    $this->actingAs($admin)->get("/admin/memos/{$trashed->id}/edit")->assertNotFound();
});

test('the list treats array values and percent signs in the filters as plain text and does not fail', function () {
    $admin = memoAdmin();
    Memo::factory()->create(['subject' => 'Plain subject']);
    Memo::factory()->create(['subject' => '100% attendance_rule']);

    $this->actingAs($admin)->get('/admin/memos?search[]=x&status[]=draft&type[]=Memorandum')->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('memos.data', 2));

    $this->actingAs($admin)->get('/admin/memos?search=%25')->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('memos.data', 1)->where('memos.data.0.subject', '100% attendance_rule'));
});
