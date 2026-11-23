import { file } from '@/routes/pds';

/**
 * URL of a stored PDS upload such as "pds/1/work_experience/cert.pdf".
 * These files are private: the server checks who is asking, so the link only works for the owner and HR.
 */
export function pdsFileUrl(path: string | null | undefined): string | null {
    return path ? file.url({ query: { path } }) : null;
}
