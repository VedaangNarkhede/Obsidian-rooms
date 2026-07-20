import { diffManifest, ManifestEntry } from '../src/core/manifest';

describe('diffManifest', () => {
    it('returns only the entries that the remote has requested', () => {
        const local: ManifestEntry[] = [
            { path: 'note1.md', contentHash: 'hash1' },
            { path: 'note2.md', contentHash: 'hash2' },
            { path: 'image.png', contentHash: 'hash3' },
        ];
        
        const remoteNeeded = ['hash2', 'hash3'];
        
        const result = diffManifest(local, remoteNeeded);
        
        expect(result).toHaveLength(2);
        expect(result.map(r => r.path)).toContain('note2.md');
        expect(result.map(r => r.path)).toContain('image.png');
        expect(result.map(r => r.path)).not.toContain('note1.md');
    });

    it('returns empty array if remote needs nothing', () => {
        const local: ManifestEntry[] = [
            { path: 'note1.md', contentHash: 'hash1' }
        ];
        expect(diffManifest(local, [])).toEqual([]);
    });
});
