import { useState } from 'react';
import type { FocusEvent, InputHTMLAttributes } from 'react';

/** How near the limit the counter starts: 40% of the box's size, but never more than 20 characters (30 -> from 18 typed). */
function warnWithin(max: number): number {
    return Math.min(20, Math.ceil(max * 0.4));
}

/** Tracks whether the box the user is typing in has focus, so the counter follows the cursor. */
export function useFocusTracking() {
    const [focused, setFocused] = useState(false);

    return {
        focused,
        focusProps: { onFocus: () => setFocused(true), onBlur: () => setFocused(false) },
    };
}

interface CharCounterProps {
    length: number;
    max: number;
    /** Whether this box has the cursor. */
    focused: boolean;
}

/**
 * "24/30" under the box being typed in, once it is close to its limit; red at the limit. A saved value that is
 * already over the limit keeps a red "too long, please shorten" even when the box is not focused, because the server
 * will refuse to save it. Nothing otherwise, so the page loads clean and every box behaves the same.
 */
export function CharCounter({ length, max, focused }: CharCounterProps) {
    const tooLong = length > max;
    const nearLimit = focused && length > 0 && max - length <= warnWithin(max);

    if (!tooLong && !nearLimit) return null;

    const atLimit = length >= max;

    return (
        <p aria-live="polite" className={`mt-1 text-right ${atLimit ? 'text-xs text-red-500' : 'text-[10px] text-gray-400'}`}>
            {length}/{max}
            {tooLong ? ' - too long, please shorten' : atLimit ? ' - limit reached' : ''}
        </p>
    );
}

type LimitedInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'maxLength' | 'value'> & {
    maxLength: number;
    value?: string | null;
};

/** A text box that stops at `maxLength` and shows the counter while you type near the limit. Takes the usual input props. */
export default function LimitedInput({ maxLength, value, onFocus, onBlur, ...rest }: LimitedInputProps) {
    const { focused, focusProps } = useFocusTracking();

    return (
        <>
            <input
                type="text"
                maxLength={maxLength}
                value={value ?? ''}
                {...rest}
                onFocus={(e: FocusEvent<HTMLInputElement>) => {
                    focusProps.onFocus();
                    onFocus?.(e);
                }}
                onBlur={(e: FocusEvent<HTMLInputElement>) => {
                    focusProps.onBlur();
                    onBlur?.(e);
                }}
            />
            {!rest.readOnly && <CharCounter length={(value ?? '').length} max={maxLength} focused={focused} />}
        </>
    );
}
