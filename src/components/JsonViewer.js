import React, { useState } from 'react';

export default function JsonViewer({ nodes, edges, promptText }) {
  const [tab, setTab] = useState('json');
  const value =
    tab === 'json' ? JSON.stringify({ nodes, edges }, null, 2) : promptText;

  return (
    <section className="json-viewer">
      <div className="viewer-tabs">
        <button type="button" className={tab === 'json' ? 'active' : ''} onClick={() => setTab('json')}>
          JSON
        </button>
        <button type="button" className={tab === 'prompt' ? 'active' : ''} onClick={() => setTab('prompt')}>
          AI Prompt
        </button>
      </div>
      <textarea readOnly value={value} aria-label={tab === 'json' ? '다이어그램 JSON' : 'AI 프롬프트'} />
    </section>
  );
}
