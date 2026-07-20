export function computeSubgraph(
    linkGraph: Record<string, string[]>,
    startPath: string,
    depth: number
): { notes: string[], attachments: string[] } {
    const visited = new Set<string>();
    const notes = new Set<string>();
    const attachments = new Set<string>();

    const queue: { path: string; currentDepth: number }[] = [];
    queue.push({ path: startPath, currentDepth: 0 });

    while (queue.length > 0) {
        const { path, currentDepth } = queue.shift()!;

        if (visited.has(path)) continue;
        visited.add(path);

        const isAttachment = !path.endsWith('.md');
        if (isAttachment) {
            attachments.add(path);
        } else {
            notes.add(path);
        }

        if (currentDepth < depth || depth === 0) {
            // Only traverse outwards from notes, attachments don't have outgoing links in this graph representation
            if (!isAttachment) {
                const neighbors = linkGraph[path] || [];
                for (const neighbor of neighbors) {
                    if (!visited.has(neighbor)) {
                        queue.push({ path: neighbor, currentDepth: currentDepth + 1 });
                    }
                }
            }
        }
    }

    return {
        notes: Array.from(notes),
        attachments: Array.from(attachments),
    };
}
