<?php

test('missing PCN reports the 2026 wording', function () {
    $this->actingAs(pdsUser())
        ->post('/pds/save/personal', [])
        ->assertSessionHasErrors(['philsys_number' => 'PhilSys Card Number (PCN) is required.']);
});
