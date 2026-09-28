import { AfterViewInit, Directive, ElementRef, OnDestroy } from '@angular/core';

/**
 * Repairs the accessibility of the emoji picker's markup.
 *
 * ngx-emoji-mart renders every emoji as `<span class="emoji-mart-emoji"
 * aria-label="👍, +1, thumbsup">`. Two problems with that, neither of them
 * ours to fix at the source:
 *
 *  - a plain span carries no role, and aria-label is only allowed on elements
 *    that have one. Lighthouse reports it as a disallowed ARIA attribute, and
 *    a screen reader may simply ignore the label.
 *  - the label starts with the emoji character itself, which a screen reader
 *    reads out before the name - "thumbs up sign, plus one, thumbsup".
 *
 * So each span gets role="img" and a label reduced to one readable name.
 * The picker re-renders its grid on every category switch, search and scroll,
 * which is why this watches for new nodes instead of running once.
 */
@Directive({
  selector: '[appEmojiAccessibility]',
  standalone: true,
})
export class EmojiAccessibilityDirective implements AfterViewInit, OnDestroy {
  private observer?: MutationObserver;

  constructor(private host: ElementRef<HTMLElement>) { }


  /**
   * Fixes what is on screen now, then keeps watching: only childList, so the
   * attributes written here cannot trigger another pass.
   */
  ngAfterViewInit(): void {
    this.relabelEmojis();
    this.observer = new MutationObserver(() => this.relabelEmojis());
    this.observer.observe(this.host.nativeElement, { childList: true, subtree: true });
  }


  ngOnDestroy(): void {
    this.observer?.disconnect();
  }


  /** Gives every emoji span a role and a spoken name. */
  private relabelEmojis(): void {
    const emojis = this.host.nativeElement.querySelectorAll<HTMLElement>('span.emoji-mart-emoji[aria-label]');
    emojis.forEach((emoji) => {
      if (emoji.getAttribute('role') !== 'img') emoji.setAttribute('role', 'img');
      const spoken = this.spokenName(emoji.getAttribute('aria-label'));
      if (spoken && emoji.getAttribute('aria-label') !== spoken) emoji.setAttribute('aria-label', spoken);
    });
  }


  /**
   * Turns "👍, +1, thumbsup" into "thumbsup", and "😅, sweat_smile" into
   * "sweat smile".
   *
   * The first part is the emoji character and is dropped. Of the short names
   * that follow, the first one containing a letter wins - that skips ids like
   * "+1", which a screen reader reads as "plus one".
   * @param label - the label the picker generated
   */
  private spokenName(label: string | null): string | null {
    if (!label) return null;
    const parts = label.split(',').map(part => part.trim()).filter(Boolean);
    const named = parts.slice(1).find(part => /[a-z]/i.test(part)) ?? parts[1];
    return named ? named.replace(/_/g, ' ') : null;
  }
}
