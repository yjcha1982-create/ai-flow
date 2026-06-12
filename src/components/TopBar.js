import React from 'react';

export default function TopBar({
  onAddBox,
  onSave,
  onLoad,
  onToggleWorkspace,
  onCopyProject,
  workspaceOpen,
}) {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <span className="brand-mark">F</span>
        <div>
          <strong>AI Flow Studio</strong>
          <small>RULE-DRIVEN DEVELOPMENT</small>
        </div>
      </div>

      <div className="topbar-actions">
        <button className="add-box-button" type="button" onClick={onAddBox}>
          <span>+</span> Box 추가
        </button>
      </div>

      <div className="topbar-actions utility-actions">
        <button type="button" onClick={onSave}>저장</button>
        <button type="button" onClick={onLoad}>불러오기</button>
        <button type="button" className={workspaceOpen ? 'active' : ''} onClick={onToggleWorkspace}>
          AI 작업
        </button>
        <button type="button" className="primary" onClick={onCopyProject}>프로젝트 복사</button>
      </div>
    </header>
  );
}
