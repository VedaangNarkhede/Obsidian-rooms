'use client';

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
});

export function MermaidGraph({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgCode, setSvgCode] = useState('');

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Generate a unique ID for this mermaid instance
    const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
    
    mermaid.render(id, chart).then(({ svg }) => {
      setSvgCode(svg);
    }).catch(err => {
      console.error('Mermaid rendering failed', err);
      setSvgCode(`<div style="color: red;">Error rendering graph: ${err.message}</div>`);
    });
  }, [chart]);

  return <div className="mermaid" ref={containerRef} dangerouslySetInnerHTML={{ __html: svgCode }} />;
}
