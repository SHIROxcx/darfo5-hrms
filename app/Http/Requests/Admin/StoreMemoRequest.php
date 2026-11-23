<?php

namespace App\Http\Requests\Admin;

use App\Concerns\MemoValidationRules;
use Illuminate\Foundation\Http\FormRequest;

class StoreMemoRequest extends FormRequest
{
    use MemoValidationRules;

    public function authorize(): bool
    {
        return (bool) $this->user()?->hasAnyRole(['admin', 'superadmin']);
    }

    public function rules(): array
    {
        return $this->memoRules();
    }

    public function messages(): array
    {
        return $this->memoMessages();
    }
}
