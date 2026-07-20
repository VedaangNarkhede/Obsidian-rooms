import { computeSubgraph } from '../src/core/subgraph';

describe('computeSubgraph', () => {
    it('returns just the start node if depth is 0', () => {
        const graph = {
            'note1.md': ['note2.md']
        };
        const result = computeSubgraph(graph, 'note1.md', 0);
        expect(result.notes).toEqual(['note1.md']);
        expect(result.attachments).toEqual([]);
    });

    it('traverses notes and attachments correctly', () => {
        const graph = {
            'note1.md': ['note2.md', 'image.png'],
            'note2.md': ['note3.md']
        };
        const result = computeSubgraph(graph, 'note1.md', 1);
        expect(result.notes).toContain('note1.md');
        expect(result.notes).toContain('note2.md');
        expect(result.attachments).toContain('image.png');
        expect(result.notes).not.toContain('note3.md'); // beyond depth 1
    });

    it('handles circular links gracefully', () => {
        const graph = {
            'A.md': ['B.md'],
            'B.md': ['A.md']
        };
        const result = computeSubgraph(graph, 'A.md', 5);
        expect(result.notes).toHaveLength(2);
        expect(result.notes).toContain('A.md');
        expect(result.notes).toContain('B.md');
    });

    it('handles missing/broken links safely', () => {
        const graph = {
            'A.md': ['missing.md']
        };
        const result = computeSubgraph(graph, 'A.md', 1);
        expect(result.notes).toContain('A.md');
        expect(result.notes).toContain('missing.md');
    });
});
