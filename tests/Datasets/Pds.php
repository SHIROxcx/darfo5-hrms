<?php

// The PDS sections that take attachments, by the label pdsAttachmentSections() in tests/Pest.php understands.
dataset('pds attachment sections', ['eligibility', 'work experience', 'voluntary work', 'trainings']);

// [section, field path, maximum length], from pdsTextLimits() in tests/Pest.php.
dataset('pds text limits', function () {
    foreach (pdsTextLimits() as $section => $fields) {
        foreach ($fields as $path => $max) {
            yield "{$section}: {$path} max {$max}" => [$section, $path, $max];
        }
    }
});
