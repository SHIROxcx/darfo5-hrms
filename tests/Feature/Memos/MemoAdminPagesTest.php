<?php

use App\Models\Memo;
use Inertia\Testing\AssertableInertia as Assert;

// The admin memo pages: the list, the create form and the edit form.

test('a guest is sent to login and an employee is refused on the memo pages', function () {
    $memo = Memo::factory()->create();
    $uris = ['/admin/memos', '/admin/memos/create', "/admin/memos/{$memo->id}/edit", "/admin/memos/{$memo->id}"];

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
    Memo::factory()->published()->create(['subject' => 'Published one']);
    Memo::factory()->withdrawn()->create(['subject' => 'Withdrawn one']);

    $this->actingAs($admin)->get('/admin/memos')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Memos/Index')
            ->has('memos.data', 15)
            ->where('memos.total', 20)
            ->where('memos.data.0.subject', 'Withdrawn one')
            ->where('counts', ['draft' => 18, 'published' => 1, 'withdrawn' => 1])
            ->where('filters', ['status' => null, 'search' => null])
            ->missing('types'));
});

test('a list row carries only what the list shows', function () {
    Memo::factory()->published()->create(['subject' => 'Leave rules']);

    $this->actingAs(memoAdmin())->get('/admin/memos')->assertInertia(fn (Assert $page) => $page
        ->has('memos.data.0', fn (Assert $row) => $row
            ->hasAll(['id', 'subject', 'memo_date', 'status', 'published_at', 'created_by_name'])
            ->where('subject', 'Leave rules')));
});

test('the list can be filtered by status and searched by subject', function () {
    $admin = memoAdmin();
    Memo::factory()->create(['subject' => 'Leave filing reminder']);
    Memo::factory()->create(['subject' => 'Office hours']);
    Memo::factory()->published()->create(['subject' => 'Leave rules']);

    $subjects = fn (string $query) => collect($this->actingAs($admin)->get("/admin/memos{$query}")->viewData('page')['props']['memos']['data'])->pluck('subject')->sort()->values()->all();

    expect($subjects('?status=published'))->toBe(['Leave rules'])
        ->and($subjects('?status=draft'))->toBe(['Leave filing reminder', 'Office hours'])
        ->and($subjects('?search=leave'))->toBe(['Leave filing reminder', 'Leave rules'])
        ->and($subjects('?search=leave&status=draft'))->toBe(['Leave filing reminder']);
});

test('the create form has nothing to fill in but the file', function () {
    $this->actingAs(memoAdmin())->get('/admin/memos/create')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Memos/Create')
            ->missing('types')
            ->missing('defaults')
            ->missing('signatories'));
});

test('saving a new draft goes on to the edit page of that draft', function () {
    $response = $this->actingAs(memoAdmin())->post('/admin/memos', ['file' => memoUpload()]);

    $memo = Memo::firstOrFail();
    $response->assertRedirect("/admin/memos/{$memo->id}/edit");
});

test('the edit form gets the draft as saved, and a published memo cannot be edited', function () {
    $admin = memoAdmin();
    $draft = uploadedDraft(by: $admin);

    $this->actingAs($admin)->get("/admin/memos/{$draft->id}/edit")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Memos/Edit')
            ->where('memo', [
                'id' => $draft->id,
                'subject' => 'Memorandum Circular 58',
                'file_name' => 'Memorandum Circular 58.pdf',
            ]));

    $this->actingAs($admin)->get('/admin/memos/'.Memo::factory()->published()->create()->id.'/edit')->assertForbidden();

    $trashed = Memo::factory()->create();
    $trashed->delete();
    $this->actingAs($admin)->get("/admin/memos/{$trashed->id}/edit")->assertNotFound();
});

test('the list treats array values and percent signs in the filters as plain text and does not fail', function () {
    $admin = memoAdmin();
    Memo::factory()->create(['subject' => 'Plain subject']);
    Memo::factory()->create(['subject' => '100% attendance_rule']);

    $this->actingAs($admin)->get('/admin/memos?search[]=x&status[]=draft')->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('memos.data', 2));

    $this->actingAs($admin)->get('/admin/memos?search=%25')->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('memos.data', 1)->where('memos.data.0.subject', '100% attendance_rule'));
});
