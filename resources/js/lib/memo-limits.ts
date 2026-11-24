/**
 * The longest reason HR can give for withdrawing a memo, and the memo file limits. config/memos.php holds the same numbers on
 * the server; MemoLimitsParityTest fails if the two ever differ, so change them together.
 */
export const MEMO_MAX = {
    withdraw_reason: 255,
};

export const MEMO_FILE_MAX_MB = 10;
export const MEMO_FILE_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
