import { Injectable } from '@angular/core';
import DOMPurify from 'dompurify';

/**
 * Cleans message HTML before it is rendered.
 *
 * Messages are stored as HTML (formatting, emoji, file thumbnails) and were
 * previously handed straight to `bypassSecurityTrustHtml`, which switches
 * Angular's protection off. Since anyone can write to the database, that made
 * every message a script injection point: an `<img onerror="…">` in a post
 * runs in every other visitor's browser.
 *
 * Attachment thumbnails used to carry their link in an inline
 * `onclick="window.open('…')"`. Event handlers cannot survive sanitizing, so
 * the URL is lifted into `data-href` first and MessageComponent opens it from
 * a real click handler. That keeps thumbnails in already-stored messages
 * working. New messages are written with `data-href` directly - see
 * inputfield/components/upload/templates/htmlTemplates.ts.
 */
@Injectable({ providedIn: 'root' })
export class MessageSanitizerService {

  /** Tags the message editor and the thumbnail templates actually produce. */
  private static readonly ALLOWED_TAGS = [
    'p', 'div', 'span', 'br', 'b', 'strong', 'i', 'em', 'u', 's',
    'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'code', 'pre',
    'a', 'img', 'svg', 'path',
  ];

  private static readonly ALLOWED_ATTR = [
    'class', 'alt', 'title',
    'src', 'href', 'target', 'rel', 'data-href',
    'viewBox', 'xmlns', 'fill', 'd', 'width', 'height',
  ];

  /** Only absolute http(s) and relative urls - no javascript:, no data:. */
  private static readonly ALLOWED_URI =
    /^(?:https?:\/\/|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i;

  /**
   * Returns a safe version of the given message HTML.
   * @param html - the raw message text as stored in Firestore
   */
  sanitize(html: string): string {
    return DOMPurify.sanitize(this.liftThumbnailLinks(html), {
      ALLOWED_TAGS: MessageSanitizerService.ALLOWED_TAGS,
      ALLOWED_ATTR: MessageSanitizerService.ALLOWED_ATTR,
      ALLOWED_URI_REGEXP: MessageSanitizerService.ALLOWED_URI,
      FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form', 'input'],
      ADD_ATTR: ['target'],
    });
  }

  /**
   * Rewrites the legacy `onclick="window.open('url', …)"` on attachment
   * thumbnails into `data-href="url"` so the link survives sanitizing.
   * Anything else in an onclick is dropped.
   * @param html - the raw message text
   */
  private liftThumbnailLinks(html: string): string {
    return html.replace(
      /\son\w+\s*=\s*"([^"]*)"/gi,
      (_match, handler: string) => {
        const url = /window\.open\(\s*'(https?:\/\/[^']+)'/i.exec(handler)?.[1];
        return url ? ` data-href="${url.replace(/"/g, '&quot;')}"` : '';
      }
    );
  }
}
