<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Http\Request;

trait ReadsQueryText
{
    /** A query-string value as trimmed plain text. Anything that is not a string (such as ?search[]=x) counts as empty. */
    protected function queryText(Request $request, string $key): string
    {
        $value = $request->query($key);

        return is_string($value) ? trim($value) : '';
    }
}
