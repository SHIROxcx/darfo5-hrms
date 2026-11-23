<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One signatory of one memo: a copy of the saved signatory's name, position and picture, with the memo's own label. */
class MemoSignatory extends Model
{
    protected $fillable = ['memo_id', 'signatory_id', 'sort_order', 'label', 'name', 'position', 'signature_path'];

    public function memo(): BelongsTo
    {
        return $this->belongsTo(Memo::class);
    }

    public function signatory(): BelongsTo
    {
        return $this->belongsTo(Signatory::class);
    }

    /**
     * The details to show for this signer. While the memo is a draft that is the saved person as they are now (what publishing
     * will copy); afterwards it is this row's own frozen copy, whatever happens to the saved list.
     */
    public function shown(bool $live): Signatory|self
    {
        return $live && $this->signatory ? $this->signatory : $this;
    }
}
