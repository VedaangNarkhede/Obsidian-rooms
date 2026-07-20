import { preprocessObsidianMarkdown } from './markdown';

describe('preprocessObsidianMarkdown', () => {
    it('should convert ==highlight== to <mark>highlight</mark>', () => {
        const input = "This is a ==highlighted== text.";
        const expected = "This is a <mark>highlighted</mark> text.";
        expect(preprocessObsidianMarkdown(input)).toBe(expected);
    });

    it('should convert [[Note Name]] to a markdown link', () => {
        const input = "Check out my [[Project Ideas]] note.";
        const expected = "Check out my [Project Ideas](/notes/Project%20Ideas) note.";
        expect(preprocessObsidianMarkdown(input)).toBe(expected);
    });

    it('should convert [[Target|Display Text]] to a markdown link with display text', () => {
        const input = "Here is a link to [[Project Ideas|my ideas]].";
        const expected = "Here is a link to [my ideas](/notes/Project%20Ideas).";
        expect(preprocessObsidianMarkdown(input)).toBe(expected);
    });

    it('should convert ![[image.png]] to a markdown image with resolved URL', () => {
        const input = "Look at this image: ![[screenshot.png]]";
        const map = {
            'screenshot.png': 'https://cloudinary.com/my-image.png'
        };
        const expected = "Look at this image: ![screenshot.png](https://cloudinary.com/my-image.png)";
        expect(preprocessObsidianMarkdown(input, map)).toBe(expected);
    });

    it('should convert ![[image.png]] with a missing URL to a fallback', () => {
        const input = "![[missing.jpg]]";
        const expected = "![missing.jpg](#missing-attachment)";
        expect(preprocessObsidianMarkdown(input)).toBe(expected);
    });
});
