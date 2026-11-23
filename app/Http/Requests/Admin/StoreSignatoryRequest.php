<?php

namespace App\Http\Requests\Admin;

use App\Concerns\SignatoryValidationRules;
use Illuminate\Foundation\Http\FormRequest;

class StoreSignatoryRequest extends FormRequest
{
    use SignatoryValidationRules;

    public function authorize(): bool
    {
        return (bool) $this->user()?->hasAnyRole(['admin', 'superadmin']);
    }

    public function rules(): array
    {
        return $this->signatoryRules();
    }

    public function messages(): array
    {
        return $this->signatoryMessages();
    }
}
