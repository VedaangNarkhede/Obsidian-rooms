export interface ManifestEntry {
    path: string;
    contentHash: string;
}

export function diffManifest(local: ManifestEntry[], remoteNeeded: string[]): ManifestEntry[] {
    const neededSet = new Set(remoteNeeded);
    return local.filter(entry => neededSet.has(entry.contentHash));
}
