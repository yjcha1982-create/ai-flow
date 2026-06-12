import React from 'react';

export default function FlowHeader({ path, validation, onOpenFlow }) {
  return (
    <div className="flow-header">
      <div className="breadcrumbs">
        {path.map((flow, index) => (
          <React.Fragment key={flow.id}>
            {index > 0 && <span>/</span>}
            <button type="button" onClick={() => onOpenFlow(flow.id)}>
              {flow.title}
            </button>
          </React.Fragment>
        ))}
      </div>
      <div className={`flow-health ${validation.valid ? 'valid' : 'invalid'}`}>
        <span />
        {validation.valid ? '실행 가능' : `오류 ${validation.errors}`}
      </div>
    </div>
  );
}
