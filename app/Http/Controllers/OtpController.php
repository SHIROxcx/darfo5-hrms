<?php

namespace App\Http\Controllers;

use App\Mail\OtpMail;
use App\Models\EmailVerificationOtp;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;

class OtpController extends Controller
{
     public function send(Request $request)
    {
        $request->validate(['email' => ['required', 'email', 'exists:users,email']]);

        $user  = auth()->user();
        $email = $user->email;
        $key   = 'otp-send:' . $email;

        // Rate limit: max 3 sends per 5 minutes
        if (RateLimiter::tooManyAttempts($key, 3)) {
            $seconds = RateLimiter::availableIn($key);
            return response()->json([
                'message' => "Too many attempts. Please wait {$seconds} seconds.",
            ], 429);
        }

        RateLimiter::hit($key, 300); // 5 minutes

        // Invalidate previous OTPs for this email
        EmailVerificationOtp::where('email', $email)
            ->whereNull('used_at')
            ->update(['used_at' => now()]);

        $otp  = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $user = User::where('email', $email)->first();

        EmailVerificationOtp::create([
            'email'      => $email,
            'otp'        => $otp,
            'expires_at' => now()->addMinutes(10),
        ]);

        Mail::to($email)->send(new OtpMail($otp, $user->first_name));

        return response()->json(['message' => 'OTP sent successfully.']);
    }

    public function verify(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email', 'exists:users,email'],
            'otp'   => ['required', 'string', 'size:6'],
        ]);

        $record = EmailVerificationOtp::where('email', $request->email)
            ->where('otp', $request->otp)
            ->whereNull('used_at')
            ->latest()
            ->first();

        if (! $record || ! $record->isValid()) {
            return response()->json([
                'message' => 'Invalid or expired OTP. Please request a new code.',
            ], 422);
        }

        // Mark OTP as used
        $record->update(['used_at' => now()]);

        // Mark user email as verified
        $user = User::where('email', $request->email)->first();

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
            event(new Verified($user));
        }
        
        // Log the user out so they can't bypass the pending approval page
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Email verified successfully.']);
    }
}
