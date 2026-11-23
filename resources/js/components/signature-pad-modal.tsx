import { Check, Eraser, Undo2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

// Signature Pad Modal
//
// Draw a signature with a mouse, finger or pen. The result is a PNG with a transparent background, cropped to the ink,
// and it is handed to the form exactly like an uploaded signature image, so the server and the PDF need nothing new.

/** A point on the pad. Both numbers are a fraction of the pad's WIDTH, so resizing the window keeps the drawing. */
type PadPoint = { x: number; y: number };

const PAD_INK = '#111111';
const PAD_EXPORT_SCALE = 3; // the picture is made 3x the pad's on-screen size, so it prints sharp
const padLineWidth = (width: number) => Math.max(2, width * 0.005);

function drawStrokes(ctx: CanvasRenderingContext2D, strokes: PadPoint[][], width: number, lineWidth: number) {
    ctx.strokeStyle = PAD_INK;
    ctx.fillStyle = PAD_INK;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const stroke of strokes) {
        const pts = stroke.map(p => ({ x: p.x * width, y: p.y * width }));

        if (pts.length === 1) { // a single tap is a dot
            ctx.beginPath();
            ctx.arc(pts[0].x, pts[0].y, lineWidth / 2, 0, Math.PI * 2);
            ctx.fill();
            continue;
        }

        // Curve through the midpoints of the samples so the line looks like handwriting, not a polygon.
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length - 1; i++) {
            ctx.quadraticCurveTo(pts[i].x, pts[i].y, (pts[i].x + pts[i + 1].x) / 2, (pts[i].y + pts[i + 1].y) / 2);
        }
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.stroke();
    }
}

export default function SignaturePadModal({ onSave, onClose }: { onSave: (blob: Blob) => void; onClose: () => void }) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const strokes   = useRef<PadPoint[][]>([]);
    const drawing   = useRef<number | null>(null); // the pointerId that is drawing now; any other finger or pen is ignored
    const [strokeCount, setStrokeCount] = useState(0);

    // Draw everything again at the pad's current size (crisp on high-density screens too).
    const paint = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const dpr  = window.devicePixelRatio || 1;
        if (canvas.width !== Math.round(rect.width * dpr)) {
            canvas.width  = Math.round(rect.width * dpr);
            canvas.height = Math.round(rect.height * dpr);
        }
        const ctx = canvas.getContext('2d')!;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, rect.width, rect.height);
        drawStrokes(ctx, strokes.current, rect.width, padLineWidth(rect.width));
    }, []);

    useEffect(() => {
        paint();
        window.addEventListener('resize', paint);
        return () => window.removeEventListener('resize', paint);
    }, [paint]);

    useEffect(() => {
        const opener = document.activeElement as HTMLElement | null;
        dialogRef.current?.focus();
        return () => opener?.focus(); // put the focus back on the button that opened the window
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { onClose(); return; }
            if (e.key !== 'Tab' || !dialogRef.current) return;

            // Keep Tab inside the window.
            const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled])'));
            if (items.length === 0) return;
            const first = items[0];
            const last  = items[items.length - 1];
            if (e.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const pointOf = (e: React.PointerEvent<HTMLCanvasElement>): PadPoint => {
        const rect = e.currentTarget.getBoundingClientRect();
        // A stroke dragged past the edge is held at the edge, so what is drawn on the pad is what is saved.
        return {
            x: Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1),
            y: Math.min(Math.max((e.clientY - rect.top) / rect.width, 0), rect.height / rect.width),
        };
    };

    const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (drawing.current !== null) return; // a palm or a second finger while one is already drawing
        e.currentTarget.setPointerCapture(e.pointerId); // keep drawing even if the pointer leaves the pad
        drawing.current = e.pointerId;
        strokes.current.push([pointOf(e)]);
        setStrokeCount(strokes.current.length);
        paint();
    };
    const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (drawing.current !== e.pointerId) return;
        strokes.current[strokes.current.length - 1].push(pointOf(e));
        paint();
    };
    const endStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (drawing.current === e.pointerId) drawing.current = null;
    };

    const undo = () => {
        strokes.current.pop();
        setStrokeCount(strokes.current.length);
        paint();
    };
    const clear = () => {
        strokes.current = [];
        setStrokeCount(0);
        paint();
    };

    // Crop to the ink (plus a small margin) so the signature fills the picture, however big the pad was.
    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas || strokes.current.length === 0) return;

        const width = canvas.getBoundingClientRect().width;
        const k = PAD_EXPORT_SCALE;
        const lineWidth = padLineWidth(width) * k;
        const margin = Math.ceil(lineWidth * 2 + 6 * k);

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const stroke of strokes.current) {
            for (const p of stroke) {
                minX = Math.min(minX, p.x * width * k); maxX = Math.max(maxX, p.x * width * k);
                minY = Math.min(minY, p.y * width * k); maxY = Math.max(maxY, p.y * width * k);
            }
        }

        const out = document.createElement('canvas');
        out.width  = Math.max(8, Math.ceil(maxX - minX + margin * 2));
        out.height = Math.max(8, Math.ceil(maxY - minY + margin * 2));
        const ctx = out.getContext('2d')!;
        ctx.translate(margin - minX, margin - minY);
        drawStrokes(ctx, strokes.current, width * k, lineWidth);
        out.toBlob(blob => { if (blob) onSave(blob); }, 'image/png');
    };

    const hasInk = strokeCount > 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="signature-pad-title" tabIndex={-1}
                className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden outline-none">
                <div className="flex items-center justify-between border-b px-5 py-4">
                    <div>
                        <h3 id="signature-pad-title" className="font-semibold text-green-800">Draw Your Signature</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Use your mouse, finger or pen</p>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close" className="cursor-pointer text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="px-5 py-4">
                    <div className="relative w-full aspect-5/2 rounded-xl border-2 border-dashed border-gray-300 bg-white overflow-hidden">
                        {!hasInk && (
                            <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-gray-300 select-none">
                                Sign here
                            </span>
                        )}
                        <span className="pointer-events-none absolute left-6 right-6 bottom-[28%] border-b border-gray-200" />
                        <canvas
                            ref={canvasRef}
                            role="img"
                            aria-label="Signature drawing area"
                            className="absolute inset-0 h-full w-full cursor-crosshair touch-none select-none"
                            style={{ WebkitTouchCallout: 'none' }}
                            onPointerDown={onPointerDown}
                            onPointerMove={onPointerMove}
                            onPointerUp={endStroke}
                            onPointerCancel={endStroke}
                            onLostPointerCapture={endStroke}
                            onContextMenu={e => e.preventDefault()}
                        />
                    </div>
                    <p className="mt-2 text-xs text-gray-400">
                        Your signature is saved as a picture with a transparent background, the same as an uploaded one.
                        Can&apos;t draw here? Close this window and upload an image instead.
                    </p>
                </div>

                <div className="flex items-center justify-between px-5 py-4 border-t bg-gray-50">
                    <div className="flex items-center gap-1">
                        <button type="button" onClick={undo} disabled={!hasInk} title="Undo last stroke"
                            className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-3 text-xs font-medium text-gray-600 hover:bg-gray-100 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                            <Undo2 className="w-5 h-5" />
                        </button>
                        <button type="button" onClick={clear} disabled={!hasInk} title="Clear"
                            className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-3 text-xs font-medium text-gray-600 hover:bg-gray-100 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                            <Eraser className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={onClose}
                            className="cursor-pointer rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                            Cancel
                        </button>
                        <button type="button" onClick={handleSave} disabled={!hasInk}
                            className="flex cursor-pointer items-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-60 disabled:cursor-not-allowed">
                            <Check className="w-4 h-4" /> Use Signature
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
