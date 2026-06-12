import React from 'react';

const edgeTypes = ['flow', 'call', 'data', 'dependency', 'condition', 'prompt_ref'];

function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export default function RightPanel({
  selectedNode,
  selectedEdge,
  updateNode,
  updateEdge,
  deleteSelected,
}) {
  if (!selectedNode && !selectedEdge) {
    return (
      <div className="right-panel empty-panel">
        <div className="empty-icon">◇</div>
        <h2>선택된 항목이 없습니다</h2>
        <p>노드나 연결선을 선택하면 상세 정보와 AI 프롬프트를 편집할 수 있습니다.</p>
      </div>
    );
  }

  if (selectedNode) {
    const data = selectedNode.data;
    const change = (key, value) => updateNode(selectedNode.id, { [key]: value });

    return (
      <div className="right-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">NODE INSPECTOR</p>
            <h2>노드 편집</h2>
          </div>
          <span className={`type-chip ${data.nodeType}`}>{data.nodeType}</span>
        </div>

        <Field label="제목">
          <input value={data.title || ''} onChange={(event) => change('title', event.target.value)} />
        </Field>

        {data.nodeType === 'api' && (
          <div className="field-row">
            <Field label="Method">
              <select value={data.method || 'GET'} onChange={(event) => change('method', event.target.value)}>
                {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((method) => (
                  <option key={method}>{method}</option>
                ))}
              </select>
            </Field>
            <Field label="Endpoint">
              <input value={data.endpoint || ''} onChange={(event) => change('endpoint', event.target.value)} />
            </Field>
          </div>
        )}

        <Field label="설명">
          <textarea rows="4" value={data.description || ''} onChange={(event) => change('description', event.target.value)} />
        </Field>

        <Field label="AI 프롬프트" hint="이 노드의 역할과 구현 요구사항을 구체적으로 작성하세요.">
          <textarea className="prompt-input" rows="7" value={data.prompt || ''} onChange={(event) => change('prompt', event.target.value)} />
        </Field>

        <Field label="메모">
          <textarea rows="3" value={data.memo || ''} onChange={(event) => change('memo', event.target.value)} />
        </Field>

        <button className="danger-button" type="button" onClick={deleteSelected}>노드 삭제</button>
      </div>
    );
  }

  const data = selectedEdge.data || {};
  const change = (key, value) => updateEdge(selectedEdge.id, { ...data, [key]: value });

  return (
    <div className="right-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">EDGE INSPECTOR</p>
          <h2>관계 편집</h2>
        </div>
        <span className="type-chip edge">{data.edgeType || 'flow'}</span>
      </div>

      <Field label="관계 타입">
        <select value={data.edgeType || 'flow'} onChange={(event) => change('edgeType', event.target.value)}>
          {edgeTypes.map((type) => <option key={type}>{type}</option>)}
        </select>
      </Field>

      <Field label="라벨">
        <input value={data.label || selectedEdge.label || ''} onChange={(event) => change('label', event.target.value)} />
      </Field>

      <Field label="설명">
        <textarea rows="4" value={data.description || ''} onChange={(event) => change('description', event.target.value)} />
      </Field>

      <Field label="AI 프롬프트" hint="두 노드가 상호작용하는 방식과 조건을 작성하세요.">
        <textarea className="prompt-input" rows="7" value={data.prompt || ''} onChange={(event) => change('prompt', event.target.value)} />
      </Field>

      <button className="danger-button" type="button" onClick={deleteSelected}>연결선 삭제</button>
    </div>
  );
}
