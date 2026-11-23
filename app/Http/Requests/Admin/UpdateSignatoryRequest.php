<?php

namespace App\Http\Requests\Admin;

use App\Concerns\SignatoryValidationRules;
use Illuminate\Foundation\Http\FormRequest;

class UpdateSignatoryRequest extends FormRequest
{
    use SignatoryValidationRules;

    public function authorize(): bool
    {
        return (bool) $this->user()?->hasAnyRole(['admin', 'superadmin']);
    }

    public function rules(): array
    {
        return $this->signatoryRules() + [
            'is_active' => ['sometimes', 'boolean'],
            'remove_signature' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return $this->signatoryMessages();
    }
}
