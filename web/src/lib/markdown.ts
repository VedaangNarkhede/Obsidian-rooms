export function preprocessObsidianMarkdown(content: string, attachmentMap: Record<string, string> = {}): string {
    let md = content;

    // 0. Process Horizontal Rules explicitly to avoid markdown parsing weirdness
    md = md.replace(/^---[\s]*$/gm, '\n\n<hr/>\n\n');

    // 1. Process Obsidian Highlights: ==text== -> <mark>text</mark>
    md = md.replace(/==(.*?)==/g, '<mark>$1</mark>');

    // Replace Obsidian image embeds ![[filename | size]] with standard markdown ![filename](url) or HTML
    const imageEmbedRegex = /!\[\[(.*?)\]\]/g;
    md = md.replace(imageEmbedRegex, (match, p1) => {
        const parts = p1.split('|');
        const filename = parts[0].trim();
        const altOrSize = parts.length > 1 ? parts[1].trim() : '';
        const url = attachmentMap[filename] || '#missing-attachment';
        
        let widthStr = '';
        if (altOrSize && !isNaN(Number(altOrSize))) {
            widthStr = ` width="${altOrSize}"`;
        } else if (altOrSize.match(/^\d+x\d+$/)) {
            const w = altOrSize.split('x')[0];
            widthStr = ` width="${w}"`;
        }

        if (widthStr) {
            return `<img src="${url}" alt="${filename}"${widthStr} style="display: block; margin: 2rem auto; max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);" />`;
        }
        return `![${altOrSize || filename}](${url})`;
    });

    // Replace standard markdown images ![Alt](path) that point to local attachments
    const standardImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    md = md.replace(standardImageRegex, (match, alt, urlPath) => {
        const filename = urlPath.split('/').pop()?.trim();
        if (filename && attachmentMap[filename]) {
            const url = attachmentMap[filename];
            const altParts = alt.split('|');
            let widthStr = '';
            const altOrSize = altParts.length > 1 ? altParts[1].trim() : altParts[0].trim();

            if (altParts.length > 1) {
                if (!isNaN(Number(altOrSize))) {
                    widthStr = ` width="${altOrSize}"`;
                } else if (altOrSize.match(/^\d+x\d+$/)) {
                    const w = altOrSize.split('x')[0];
                    widthStr = ` width="${w}"`;
                }
            }
            
            if (widthStr) {
                return `<img src="${url}" alt="${altParts[0]}"${widthStr} style="display: block; margin: 2rem auto; max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);" />`;
            }
            return `![${alt}](${url})`;
        }
        return match;
    });

    // Replace Obsidian callouts: > [!note] Title \n > Body \n > Body
    const calloutBlockRegex = /^(>[\s]*\[!([^\]]+)\].*(?:\r?\n>.*)*)/gm;
    md = md.replace(calloutBlockRegex, (match) => {
        const lines = match.split(/\r?\n/);
        const firstLine = lines[0];
        const typeMatch = firstLine.match(/>\s*\[!([^\]]+)\](.*)/);
        if (!typeMatch) return match;
        
        const type = typeMatch[1];
        const title = typeMatch[2];
        const typeLower = type.toLowerCase();
        
        let icon = '💡';
        if (typeLower === 'important' || typeLower === 'tip') icon = '❗';
        else if (typeLower === 'warning' || typeLower === 'question') icon = '⚠️';
        else if (typeLower === 'danger') icon = '🔴';
        else if (typeLower === 'success') icon = '✅';
        else if (typeLower === 'bug') icon = '🐞';
        else if (typeLower === 'abstract' || typeLower === 'summary' || typeLower === 'tldr') icon = '📋';
        else if (typeLower === 'formula' || typeLower === 'math') icon = '✏️';
        
        const bodyLines = lines.slice(1).map(l => l.replace(/^>\s?/, ''));
        let body = bodyLines.join('\n');
        
        // Ensure HRs inside callouts don't break the HTML block context
        body = body.replace(/^---[\s]*$/gm, '\n\n<hr/>\n\n');
        
        return `<div class="obsidian-callout obsidian-callout-${typeLower}">
            <div class="callout-title"><span class="callout-icon">${icon}</span> ${title.trim() || type}</div>
            <div class="callout-content">\n\n${body}\n\n</div>
        </div>`;
    });

    // 3. Process Obsidian Wiki-Links: [[Note Name]]
    md = md.replace(/\[\[(.*?)\]\]/g, (match, p1) => {
        let displayText = p1;
        let target = p1;

        if (p1.includes('|')) {
            const parts = p1.split('|');
            target = parts[0];
            displayText = parts[1];
        }

        const safeTarget = encodeURIComponent(target.trim());
        return `<a href="${safeTarget}" class="internal-link">${displayText.trim()}</a>`;
    });

    return md;
}
