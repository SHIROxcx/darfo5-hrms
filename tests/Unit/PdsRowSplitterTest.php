<?php

use App\Support\PdsRowSplitter;

test('no rows give an empty main page and no sheets', function () {
    $split = PdsRowSplitter::split([], 3, 2);

    expect($split['main']->all())->toBe([])
        ->and($split['sheets'])->toBe([]);
});

test('rows at capacity stay on the main page', function () {
    $split = PdsRowSplitter::split([1, 2, 3], 3, 2);

    expect($split['main']->all())->toBe([1, 2, 3])
        ->and($split['sheets'])->toBe([]);
});

test('one row over capacity goes to one continuation sheet', function () {
    $split = PdsRowSplitter::split([1, 2, 3, 4], 3, 2);

    expect($split['main']->all())->toBe([1, 2, 3])
        ->and($split['sheets'])->toHaveCount(1)
        ->and($split['sheets'][0]->all())->toBe([4]);
});

test('overflow fills several sheets in order', function () {
    $split = PdsRowSplitter::split(range(1, 8), 3, 2);

    expect($split['main']->all())->toBe([1, 2, 3])
        ->and(array_map(fn ($sheet) => $sheet->all(), $split['sheets']))->toBe([[4, 5], [6, 7], [8]]);
});

test('a capacity below one is rejected', function (int $main, int $sheet) {
    PdsRowSplitter::split([1], $main, $sheet);
})->with([[0, 2], [3, 0]])->throws(InvalidArgumentException::class);
