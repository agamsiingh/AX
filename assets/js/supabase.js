/* ═══════════════════════════════════════════
   AGMIEX — Minimal Supabase REST client
   Replaces the ~100 KB supabase-js CDN bundle: the site only ever inserts rows.
   ═══════════════════════════════════════════ */

import { CONFIG } from './config.js';

export class SubmitError extends Error {
  /**
   * @param {'offline'|'timeout'|'network'|'duplicate'|'server'} kind
   * @param {string} message
   * @param {string} [code]
   */
  constructor(kind, message, code) {
    super(message);
    this.name = 'SubmitError';
    this.kind = kind;
    this.code = code;
  }
}

/**
 * Insert a single row into a Supabase table. Resolves on success, throws SubmitError otherwise.
 * @param {string} table
 * @param {Record<string, string>} row
 */
export async function insertRow(table, row) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new SubmitError('offline', 'You appear to be offline.');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.requestTimeoutMs);
  let response;

  try {
    response = await fetch(`${CONFIG.supabaseUrl}/rest/v1/${encodeURIComponent(table)}`, {
      method: 'POST',
      headers: {
        apikey: CONFIG.supabaseKey,
        Authorization: `Bearer ${CONFIG.supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
      signal: controller.signal,
    });
  } catch (err) {
    if (err && err.name === 'AbortError') {
      throw new SubmitError('timeout', 'The request timed out.');
    }
    throw new SubmitError('network', 'Network request failed.');
  } finally {
    clearTimeout(timer);
  }

  if (response.ok) return;

  let body = {};
  try {
    body = await response.json();
  } catch {
    /* non-JSON error body */
  }

  if (body.code === '23505') {
    throw new SubmitError('duplicate', 'This entry already exists.', body.code);
  }
  throw new SubmitError('server', body.message || `Request failed (${response.status}).`, body.code);
}
