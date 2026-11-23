<?php

namespace App\Http\Requests\Admin;

use App\Concerns\MemoValidationRules;
use Illuminate\Foundation\Http\FormRequest;

class UpdateMemoRequest extends FormRequest
{
    use MemoValidationRules;

    /** Admins and superadmins, and only while the memo is still a draft: a published memo is frozen. */
    public function authorize(): bool
    {
        return (bool) $this->user()?->hasAnyRole(['admin', 'superadmin']) && $this->route('memo')->isDraft();
    }

    public function rules(): array
    {
        return $this->memoRules($this->route('memo'));
    }

    public function messages(): array
    {
        return $this->memoMessages();
    }
}
