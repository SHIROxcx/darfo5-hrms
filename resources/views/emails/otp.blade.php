<x-mail::message>
# Email Verification

Hello, **{{ $firstName }}**!

To complete your registration at **DA RFO 5 HRMS**, please use the verification code below:
    
<x-mail::panel>
# {{ $otp }}
</x-mail::panel>

This code is valid for **10 minutes**. Do not share it with anyone.

If you did not request this, please ignore this email.

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
