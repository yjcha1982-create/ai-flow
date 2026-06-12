import React from 'react';

const nodeButtons = [
  ['screen', '화면'],
  ['component', '컴포넌트'],
  ['api', 'API'],
  ['state', '상태'],
  ['ai_task', 'AI 명령'],
];

export default function TopBar({
  onAddNode,
  onSave,
  onLoad,
  onToggleJson,
  onCopyJson,
  showJson,
}) {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <span className="brand-mark">U</span>
        <div>
          <strong>AI UML Builder</strong>
          <small>Visual prompt architecture</small>
        </div>
      </div>

      <div className="topbar-actions node-actions">
        {nodeButtons.map(([type, label]) => (
          <button key={type} type="button" onClick={() => onAddNode(type)}>
            <span>+</span> {label}
          </button>
        ))}
      </div>

      <div className="topbar-actions utility-actions">
        <button type="button" onClick={onSave}>저장</button>
        <button type="button" onClick={onLoad}>불러오기</button>
        <button type="button" className={showJson ? 'active' : ''} onClick={onToggleJson}>
          JSON 보기
        </button>
        <button type="button" className="primary" onClick={onCopyJson}>JSON 복사</button>
      </div>
    </header>
  );
}
