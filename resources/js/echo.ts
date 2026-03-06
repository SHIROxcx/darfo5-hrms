
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Attach Pusher to window so Echo can find it internally
(window as Window & { Pusher?: typeof Pusher }).Pusher = Pusher;

const echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY as string,
    wsHost: import.meta.env.VITE_REVERB_HOST as string,
    wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
    wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
    enabledTransports: ['ws', 'wss'],
    // Auth endpoint for private channels — uses existing session cookie
    authEndpoint: '/broadcasting/auth',
});

export default echo;