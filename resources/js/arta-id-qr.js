import QRCode from 'qrcode';

// Expose a small helper globally so the inline Blade <script> can call it
window.renderQRCode = async function (elementId, text) {
    const el = document.getElementById(elementId);
    if (!el || !text) return;

    const canvas = document.createElement('canvas');
    await QRCode.toCanvas(canvas, text, {
        width: 80,
        margin: 0,
        errorCorrectionLevel: 'H',
    });
    el.innerHTML = '';
    el.appendChild(canvas);
};