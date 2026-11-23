<?php

namespace App\Services;

use App\Models\Memo;
use App\Support\MemoFiles;
use App\Support\PdfBrowsershot;
use Illuminate\Support\Carbon;

/**
 * Prints a written memo: the same Blade page is the PDF and the on-screen check, so they never drift apart.
 *
 * A draft prints with a DRAFT watermark and takes its signatories from the saved list as it is now (what publishing will
 * copy). A published memo prints its own copied rows, so it reads the same however the saved list changes later.
 */
class MemoPdfService
{
    private const CIRCULAR = 'Memorandum Circular';

    /** The page the PDF is made from. */
    public function buildHtml(Memo $memo, bool $preview = false): string
    {
        $memo->loadMissing('signatories.signatory');

        $letterhead = config('memos.letterhead');
        $date = $memo->memo_date;
        $time = $memo->memo_time ? Carbon::parse($memo->memo_time)->format('g:i A') : null;
        $live = $memo->isDraft();

        return view('memos.memo', [
            'preview' => $preview,
            'letterhead' => $letterhead,
            'logos' => [
                $this->imageDataUri(public_path('images/letterhead/bagong-pilipinas.png')),
                $this->imageDataUri(public_path('images/letterhead/da-rfo5.png')),
            ],
            'title' => mb_strtoupper($memo->type),
            'numberLine' => $memo->number !== null ? "No. {$memo->number}" : 'No. ____',
            'seriesLine' => $memo->series_year ? "Series of {$memo->series_year}" : 'Series of ____',
            'addressedTo' => $memo->addressed_to,
            'subject' => $memo->subject,
            'dateLine' => $date->format('F j, Y').($time ? ", {$time}" : ''),
            'paragraphs' => $this->paragraphs($memo->body),
            'doneLine' => $memo->type === self::CIRCULAR ? "Done this {$date->format('jS')} day of {$date->format('F, Y')}." : null,
            'signers' => $memo->signatories->map(function ($row) use ($live) {
                $from = $row->shown($live);

                return [
                    'label' => $row->label,
                    'name' => mb_strtoupper($from->name),
                    'position' => $from->position,
                    'picture' => MemoFiles::dataUri($from->signature_path),
                ];
            })->all(),
        ])->render();
    }

    public function buildPdf(Memo $memo, bool $preview = false): string
    {
        return PdfBrowsershot::make($this->buildHtml($memo, $preview))
            ->format('A4')
            ->margins(10, 18, 20, 18, 'mm')
            ->showBackground()
            ->showBrowserHeaderAndFooter()
            ->hideHeader()
            ->footerHtml($this->footerHtml())
            ->waitUntilNetworkIdle()
            ->timeout(60)
            ->pdf();
    }

    /** "Page x of y" at the foot of every page (Chrome fills in the two numbers). */
    public function footerHtml(): string
    {
        return '<div style="width:100%;font-size:8pt;font-family:Arial,sans-serif;color:#444;text-align:center;">'
            .'Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>';
    }

    public function filenameFor(Memo $memo): string
    {
        if ($memo->number === null) {
            return "Memo-draft-{$memo->id}.pdf";
        }

        return str_replace(' ', '-', $memo->type)."-No-{$memo->number}-S{$memo->series_year}.pdf";
    }

    /**
     * The body as escaped HTML paragraphs: a blank line starts a new paragraph, a single line break stays a line break.
     * A paragraph holding one very long unbroken string (a web address, say) is marked `ragged`: justified text would stretch
     * the words before it far apart, so it is left-aligned instead.
     *
     * @return list<array{html: string, ragged: bool}>
     */
    private function paragraphs(?string $body): array
    {
        if (! filled($body)) {
            return [];
        }

        return array_map(fn (string $paragraph) => [
            'html' => nl2br(e(trim($paragraph))),
            'ragged' => (bool) preg_match('/\S{40,}/u', $paragraph),
        ], preg_split('/\R{2,}/', trim($body)));
    }

    private function imageDataUri(string $absolutePath): ?string
    {
        if (! is_file($absolutePath)) {
            return null;
        }

        return 'data:image/png;base64,'.base64_encode(file_get_contents($absolutePath));
    }
}
