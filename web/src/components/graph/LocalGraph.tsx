'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

// Dynamic import with SSR disabled since it uses canvas/window APIs
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

interface NoteNode {
  id: string;
  name: string;
  val: number;
  color?: string;
}

interface NoteLink {
  source: string;
  target: string;
}

interface LocalGraphProps {
  currentNotePath: string;
  vaultId: string;
  notes: {
    path: string;
    outgoingLinks: string[];
  }[];
}

function LocalGraph({ currentNotePath, vaultId, notes }: LocalGraphProps) {
  const router = useRouter();
  const [dimensions, setDimensions] = useState({ width: 300, height: 400 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const graphData = useMemo(() => {
    // Build nodes and links based on 1-degree of separation from currentNotePath
    const nodesMap = new Map<string, NoteNode>();
    const links: NoteLink[] = [];

    // Extract basename for display
    const getBasename = (p: string) => {
        let name = p.split('/').pop() || p;
        if (name.endsWith('.md')) name = name.slice(0, -3);
        return name;
    };

    // Find current note
    const currentNote = notes.find(n => n.path === currentNotePath);
    if (currentNote) {
        nodesMap.set(currentNote.path, {
            id: currentNote.path,
            name: getBasename(currentNote.path),
            val: 20,
            color: '#e5c07b' // Current note highlighted
        });

        // Add outgoing targets
        for (const target of currentNote.outgoingLinks) {
            if (!nodesMap.has(target)) {
                const targetExists = notes.some(n => n.path === target);
                nodesMap.set(target, {
                    id: target,
                    name: getBasename(target),
                    val: 10,
                    color: targetExists ? '#61afef' : '#555555' // Grey if missing
                });
            }
            links.push({ source: currentNote.path, target });
        }

    } else {
        // If no note selected, show a small global preview (max 50 nodes)
        let i = 0;
        for (const n of notes) {
            if (i++ > 50) break;
            nodesMap.set(n.path, { id: n.path, name: getBasename(n.path), val: 5, color: '#98c379' });
        }
        // Only add links between nodes that actually exist in the preview map
        for (const n of notes) {
            if (!nodesMap.has(n.path)) continue;
            for (const t of n.outgoingLinks) {
                if (nodesMap.has(t)) {
                    links.push({ source: n.path, target: t });
                }
            }
        }
    }

    // FINAL PASS: Filter out any links where the target is completely missing from nodesMap
    // This prevents ForceGraph2D from crashing with "node not found" when a note is deleted.
    const validLinks = links.filter(l => nodesMap.has(l.source) && nodesMap.has(l.target));

    return {
        nodes: Array.from(nodesMap.values()),
        links: validLinks
    };
  }, [currentNotePath, notes]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <ForceGraph2D
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        nodeLabel="name"
        nodeColor="color"
        linkColor={() => 'rgba(255,255,255,0.2)'}
        onNodeClick={(node: any) => {
            if (node.color === '#555555') {
                router.push(`/dashboard/${vaultId}/missing?path=${encodeURIComponent(node.name)}`);
            } else {
                router.push(`/dashboard/${vaultId}/note/${encodeURI(node.id)}`);
            }
        }}
        backgroundColor="#1e1e1e"
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        cooldownTicks={100}
        onEngineStop={() => { /* stops physics engine after 100 ticks */ }}
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const label = node.name;
          const fontSize = 12/globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // padding

          // Draw node circle
          const nodeR = Math.sqrt(Math.max(0, node.val || 1)) + 2;
          ctx.beginPath();
          ctx.arc(node.x, node.y, nodeR, 0, 2 * Math.PI, false);
          ctx.fillStyle = node.color || '#fff';
          ctx.fill();

          // Draw text background
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.beginPath();
          ctx.rect(node.x - bckgDimensions[0] / 2, node.y + nodeR + 2, bckgDimensions[0], bckgDimensions[1]);
          ctx.fill();

          // Draw text
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(label, node.x, node.y + nodeR + 2 + bckgDimensions[1]/2);
        }}
      />
    </div>
  );
}

export default React.memo(LocalGraph);
