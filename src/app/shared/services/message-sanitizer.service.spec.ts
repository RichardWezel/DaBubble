import { TestBed } from '@angular/core/testing';
import { MessageSanitizerService } from './message-sanitizer.service';

describe('MessageSanitizerService', () => {
  let service: MessageSanitizerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MessageSanitizerService);
  });

  describe('keeps legitimate message content', () => {
    it('keeps formatting produced by the editor', () => {
      const html = '<p>Test <b>fett</b>, <i>kursiv</i></p><ul><li>eins</li><li>zwei</li></ul>';
      expect(service.sanitize(html)).toBe(html);
    });

    it('keeps the welcome message markup', () => {
      const html = '<h3>🎉 Willkommen!</h3><p>Schön, dass du da bist.</p><br>';
      expect(service.sanitize(html)).toContain('<h3>');
      expect(service.sanitize(html)).toContain('🎉');
    });

    it('keeps image thumbnails and their src', () => {
      const html = '<img src="https://firebasestorage.googleapis.com/x.png" alt="Image Thumbnail" class="thumbnail-image">';
      const result = service.sanitize(html);
      expect(result).toContain('https://firebasestorage.googleapis.com/x.png');
      expect(result).toContain('class="thumbnail-image"');
    });

    it('keeps inline svg used by the pdf thumbnail', () => {
      const html = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#000000" d="M64 464l48 0z"/></svg>';
      const result = service.sanitize(html);
      expect(result).toContain('<svg');
      expect(result).toContain('<path');
      expect(result).toContain('d="M64 464l48 0z"');
    });
  });

  describe('lifts legacy thumbnail links', () => {
    it('turns onclick="window.open(url)" into data-href', () => {
      const html = `<div class="file-thumbnail" onclick="window.open('https://example.com/a.pdf', '_blank', 'noopener,noreferrer')"><p>a.pdf</p></div>`;
      const result = service.sanitize(html);
      expect(result).toContain('data-href="https://example.com/a.pdf"');
      expect(result).not.toContain('onclick');
    });

    it('drops an onclick that is not a window.open link', () => {
      const html = `<div onclick="alert('x')">hi</div>`;
      const result = service.sanitize(html);
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('alert');
      expect(result).toContain('hi');
    });

    it('does not lift a javascript: url out of window.open', () => {
      const html = `<div onclick="window.open('javascript:alert(1)')">hi</div>`;
      const result = service.sanitize(html);
      expect(result).not.toContain('javascript:');
    });
  });

  describe('removes injection vectors', () => {
    it('strips script tags', () => {
      const result = service.sanitize('<p>hallo</p><script>alert(1)</script>');
      expect(result).toContain('hallo');
      expect(result).not.toContain('<script');
      expect(result).not.toContain('alert(1)');
    });

    it('strips img onerror', () => {
      const result = service.sanitize('<img src="x" onerror="alert(1)">');
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('alert');
    });

    it('strips every other event handler', () => {
      for (const handler of ['onload', 'onmouseover', 'onfocus', 'onanimationstart']) {
        const result = service.sanitize(`<div ${handler}="alert(1)">x</div>`);
        expect(result).withContext(handler).not.toContain(handler);
      }
    });

    it('strips javascript: hrefs', () => {
      const result = service.sanitize('<a href="javascript:alert(1)">klick</a>');
      expect(result).not.toContain('javascript:');
    });

    it('strips iframes, forms and inputs', () => {
      const result = service.sanitize('<iframe src="https://evil.test"></iframe><form><input name="pw"></form>');
      expect(result).not.toContain('<iframe');
      expect(result).not.toContain('<form');
      expect(result).not.toContain('<input');
    });

    it('strips style attributes and tags', () => {
      const result = service.sanitize('<style>body{display:none}</style><p style="position:fixed;inset:0">x</p>');
      expect(result).not.toContain('<style');
      expect(result).not.toContain('style=');
      expect(result).toContain('x');
    });

    it('strips svg-based script injection', () => {
      const result = service.sanitize('<svg><script>alert(1)</script></svg>');
      expect(result).not.toContain('alert');
    });
  });
});
