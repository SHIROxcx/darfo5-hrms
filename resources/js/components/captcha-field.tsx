import { RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import InputError from '@/components/input-error';
import { captcha } from '@/routes';

// The size the server draws the picture (config/captcha.php), reserved here so the page does not jump when it loads.
const PICTURE = { width: 200, height: 56 };

interface Props {
    /** The server's message for this box, if there is one. */
    error?: string;
    /** The form's "sending" flag. Each picture works once, right or wrong, so when a send finishes a new picture is shown. */
    processing?: boolean;
    /** For a form that keeps its own state (useForm). Leave both out inside Inertia's <Form>, which reads the box by its name. */
    value?: string;
    onChange?: (value: string) => void;
    /** Only needed when two of these are on one page. */
    id?: string;
}

/** The security code: a picture of a few letters and numbers, and a box to type them in. Used on the login and sign-up pages. */
export default function CaptchaField({ error, processing = false, value, onChange, id = 'captcha' }: Props) {
    const [stamp, setStamp] = useState(() => Date.now());
    const [typed, setTyped] = useState('');
    const [broken, setBroken] = useState(false);
    const wasProcessing = useRef(false);

    const current = value ?? typed;
    const set = (next: string) => (onChange ? onChange(next) : setTyped(next));

    const newPicture = () => {
        setBroken(false);
        setStamp(Date.now());
        set('');
    };

    useEffect(() => {
        if (wasProcessing.current && !processing) newPicture();
        wasProcessing.current = processing;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [processing]);

    return (
        <div>
            <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
                Security code
            </label>

            <div className="mb-2 flex items-center gap-2">
                {broken ? (
                    <div style={PICTURE} className="flex items-center rounded-lg border border-gray-300 bg-gray-50 px-2 text-xs text-gray-500">
                        The picture could not be loaded. Press the button to try again.
                    </div>
                ) : (
                    <img
                        src={captcha({ query: { t: stamp } }).url}
                        alt="Security code: a picture of letters and numbers to type in the box below"
                        width={PICTURE.width}
                        height={PICTURE.height}
                        onError={() => setBroken(true)}
                        className="select-none rounded-lg border border-gray-300"
                        draggable={false}
                    />
                )}
                <button
                    type="button"
                    onClick={newPicture}
                    className="flex cursor-pointer items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-2 text-xs text-gray-600 transition hover:bg-gray-50"
                >
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>New picture</span>
                </button>
            </div>

            <input
                id={id}
                name="captcha"
                type="text"
                value={current}
                onChange={e => set(e.target.value)}
                maxLength={8}
                required
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="Type the letters and numbers you see"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${id}-error` : undefined}
                className={`w-full rounded-lg border bg-white px-3 py-2 text-sm uppercase placeholder:normal-case focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    error ? 'border-red-400' : 'border-gray-300'
                }`}
            />
            <InputError id={`${id}-error`} message={error} className="mt-1 text-xs" role="alert" />
        </div>
    );
}
