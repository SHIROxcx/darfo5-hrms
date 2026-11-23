/**
 * Longest text each memo box accepts, and the signatory and file limits. config/memos.php holds the same numbers on the
 * server; MemoLimitsParityTest fails if the two ever differ, so change them together.
 */
export const MEMO_MAX = {
    subject: 255,
    addressed_to: 150,
    body: 20000,
    name: 100,
    position: 100,
    label: 40,
    reference: 50,
    withdraw_reason: 255,
};

export const MEMO_MAX_SIGNATORIES = 6;
export const MEMO_FILE_MAX_MB = 10;
export const MEMO_FILE_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
