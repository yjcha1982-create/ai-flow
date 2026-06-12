import React from 'react';
import { BOX_TYPES } from '../utils/projectModel';

function FlowBranch({ project, flowId, activeFlowId, onOpenFlow, depth = 0 }) {
  const flow = project.flows[flowId];
  if (!flow) return null;

  return (
    <div className="explorer-branch">
      <button
        type="button"
        className={`explorer-flow ${activeFlowId === flow.id ? 'active' : ''}`}
        style={{ paddingLeft: 10 + depth * 13 }}
        onClick={() => onOpenFlow(flow.id)}
      >
        <span className="flow-icon">F</span>
        <span>{flow.title}</span>
        <small>{flow.nodes.length}</small>
      </button>

      {flow.nodes.map((node) => {
        const childFlowId = node.data.childFlowId;
        if (!childFlowId) return null;
        const type = BOX_TYPES[node.data.boxType] || BOX_TYPES.function;
        return (
          <div key={node.id}>
            <div className="explorer-owner" style={{ paddingLeft: 23 + depth * 13 }}>
              <span style={{ background: type.color }} />
              {node.data.title}
            </div>
            <FlowBranch
              project={project}
              flowId={childFlowId}
              activeFlowId={activeFlowId}
              onOpenFlow={onOpenFlow}
              depth={depth + 1}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function FlowExplorer({
  project,
  activeFlowId,
  onOpenFlow,
  onAddFlow,
  validation,
}) {
  return (
    <aside className="flow-explorer">
      <div className="explorer-heading">
        <p className="eyebrow">PROJECT</p>
        <h1>{project.title}</h1>
        <p>Box를 열어 내부 Flow로 이동합니다.</p>
      </div>

      <div className="explorer-section-title">
        <span>
          Flow 탐색기
          <small>{Object.keys(project.flows).length}</small>
        </span>
        <button type="button" onClick={onAddFlow} title="현재 Flow 아래에 하위 Flow 추가">
          + Flow
        </button>
      </div>
      <nav className="explorer-tree">
        <FlowBranch
          project={project}
          flowId={project.rootFlowId}
          activeFlowId={activeFlowId}
          onOpenFlow={onOpenFlow}
        />
      </nav>

      <div className={`validation-summary ${validation.valid ? 'valid' : 'invalid'}`}>
        <strong>{validation.valid ? '규칙 통과' : '규칙 위반'}</strong>
        <span>오류 {validation.errors} · 경고 {validation.warnings}</span>
      </div>

      <div className="explorer-help">
        <span>Box 삭제</span>
        <kbd>Delete</kbd>
      </div>
    </aside>
  );
}
