<?php

use App\Http\Controllers\PdsPdfController;
use App\Services\PdsPdfService;
use Symfony\Component\HttpKernel\Exception\HttpException;

// No headless Chrome in tests: HTTP checks mock the PDF service.
function mockPdsPdfService()
{
    $mock = Mockery::mock(PdsPdfService::class);
    $mock->shouldReceive('buildPdf')->atLeast()->once()->andReturn('%PDF-1.4 fake');
    $mock->shouldReceive('filenameFor')->andReturn('PDS_TEST_20261118.pdf');
    app()->instance(PdsPdfService::class, $mock);

    return $mock;
}

test('owner and admin get the PDS preview as application/pdf', function () {
    mockPdsPdfService();
    $owner = pdsUser();

    foreach ([$owner, pdsUser('admin')] as $viewer) {
        $this->actingAs($viewer)->get("/pds/preview/{$owner->public_token}")
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf');
    }
});

test('owner and admin download the PDS with the service filename', function () {
    mockPdsPdfService();
    $owner = pdsUser();

    foreach ([$owner, pdsUser('admin')] as $viewer) {
        $this->actingAs($viewer)->get("/pds/download/{$owner->public_token}")
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf')
            ->assertHeader('Content-Disposition', 'attachment; filename="PDS_TEST_20261118.pdf"');
    }
});

test('another employee gets 403 on preview and download', function () {
    $mock = Mockery::mock(PdsPdfService::class);
    $mock->shouldNotReceive('buildPdf');
    app()->instance(PdsPdfService::class, $mock);
    $owner = pdsUser();
    $other = pdsUser();

    $this->actingAs($other)->get("/pds/preview/{$owner->public_token}")->assertForbidden();
    $this->actingAs($other)->get("/pds/download/{$owner->public_token}")->assertForbidden();
});

test('an unknown token returns 404', function () {
    $this->actingAs(pdsUser())->get('/pds/preview/not-a-real-token')->assertNotFound();
});

test('html preview refuses another employee', function () {
    $owner = pdsUser();
    $this->actingAs(pdsUser());

    expect(fn () => app(PdsPdfController::class)->htmlPreview($owner->id))
        ->toThrow(HttpException::class);
});

// The view still declares PHP functions inline, so it can be rendered only once
// per process (a second render dies with "Cannot redeclare function"). Task 6
// removes them; until then this is the one place a test renders the view, and
// admin access is covered by the shared access check in the preview/download tests.
test('html preview returns the page for the owner', function () {
    $owner = pdsUser();
    $this->actingAs($owner);

    expect(app(PdsPdfController::class)->htmlPreview($owner->id)->getContent())
        ->toContain('PERSONAL DATA SHEET');
});

test('dataFor returns every PDS section for the user', function () {
    $user = pdsUser();

    $data = app(PdsPdfService::class)->dataFor($user);

    expect($data)->toHaveKeys(['user', 'ep', 'pds'])
        ->and($data['user']->is($user))->toBeTrue()
        ->and($data['pds'])->toHaveKeys([
            'personal', 'family', 'children', 'education', 'eligibilities', 'work_experience',
            'voluntary_work', 'trainings', 'other_info', 'questions', 'references', 'government_id',
        ]);
});

test('filenameFor uses the surname and today in Ymd', function () {
    $user = pdsUser();
    $user->forceFill(['last_name' => 'De la Cruz'])->save();

    expect(app(PdsPdfService::class)->filenameFor($user))
        ->toBe('PDS_DE_LA_CRUZ_'.now()->format('Ymd').'.pdf');
});
