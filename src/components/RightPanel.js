import React from 'react';
import {
  BOX_STATUSES,
  BOX_TYPES,
  RELATION_TYPES,
} from '../utils/projectModel';

function Field({ label, hint, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export default function RightPanel({
  selectedBox,
  selectedRelation,
  updateBox,
  updateRelation,
  deleteSelected,
  createChildFlow,
  openChildFlow,
}) {
  if (!selectedBox && !selectedRelation) {
    return (
      <div className="right-panel empty-panel">
        <div className="empty-icon">□</div>
        <h2>Box 또는 관계를 선택하세요</h2>
        <p>
          Box에는 프롬프트와 하위 Flow를 함께 넣을 수 있습니다. 관계에도 AI가
          준수할 의미와 프롬프트를 기록할 수 있습니다.
        </p>
      </div>
    );
  }

  if (selectedBox) {
    const data = selectedBox.data;
    const change = (key, value) => updateBox(selectedBox.id, { [key]: value });

    return (
      <div className="right-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">BOX INSPECTOR</p>
            <h2>Box 규격</h2>
          </div>
          <span className="type-chip" style={{ color: BOX_TYPES[data.boxType]?.color }}>
            {BOX_TYPES[data.boxType]?.label}
          </span>
        </div>

        <Field label="제목">
          <input value={data.title || ''} onChange={(event) => change('title', event.target.value)} />
        </Field>
        <div className="field-row equal">
          <Field label="타입">
            <select value={data.boxType} onChange={(event) => change('boxType', event.target.value)}>
              {Object.entries(BOX_TYPES).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </select>
          </Field>
          <Field label="상태">
            <select value={data.status} onChange={(event) => change('status', event.target.value)}>
              {Object.entries(BOX_STATUSES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="설명">
          <textarea rows="3" value={data.description || ''} onChange={(event) => change('description', event.target.value)} />
        </Field>
        <Field label="AI 프롬프트" hint="AI가 이 Box에서 수행해야 할 목적, 제약, 작업을 작성합니다.">
          <textarea className="prompt-input" rows="6" value={data.prompt || ''} onChange={(event) => change('prompt', event.target.value)} />
        </Field>
        <Field label="완료 조건" hint="한 줄에 하나씩 검증 가능한 조건을 작성합니다.">
          <textarea rows="4" value={data.acceptanceCriteria || ''} onChange={(event) => change('acceptanceCriteria', event.target.value)} />
        </Field>
        <Field label="기대 산출물">
          <textarea rows="3" value={data.outputs || ''} onChange={(event) => change('outputs', event.target.value)} />
        </Field>
        <Field label="실행 기록">
          <textarea rows="3" value={data.executionNote || ''} onChange={(event) => change('executionNote', event.target.value)} />
        </Field>

        <div className="child-flow-card">
          <div>
            <strong>내부 Flow</strong>
            <span>{data.childFlowId ? '이 Box는 상세 Flow를 가집니다.' : '필요하면 내부 설계를 Flow로 분해하세요.'}</span>
          </div>
          {data.childFlowId ? (
            <button type="button" onClick={() => openChildFlow(data.childFlowId)}>Flow 열기</button>
          ) : (
            <button type="button" onClick={() => createChildFlow(selectedBox.id)}>Flow 만들기</button>
          )}
        </div>

        <button className="danger-button" type="button" onClick={deleteSelected}>Box 삭제</button>
      </div>
    );
  }

  const data = selectedRelation.data || {};
  const change = (key, value) =>
    updateRelation(selectedRelation.id, { ...data, [key]: value });

  return (
    <div className="right-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">RELATION INSPECTOR</p>
          <h2>관계 규격</h2>
        </div>
        <span className="type-chip edge">
          {RELATION_TYPES[data.relationType]?.label}
        </span>
      </div>

      <Field label="관계 타입" hint={RELATION_TYPES[data.relationType]?.description}>
        <select value={data.relationType || 'sequence'} onChange={(event) => change('relationType', event.target.value)}>
          {Object.entries(RELATION_TYPES).map(([key, value]) => (
            <option key={key} value={key}>{value.label}</option>
          ))}
        </select>
      </Field>
      <Field label="라벨">
        <input value={data.label || selectedRelation.label || ''} onChange={(event) => change('label', event.target.value)} />
      </Field>
      <Field label="설명">
        <textarea rows="3" value={data.description || ''} onChange={(event) => change('description', event.target.value)} />
      </Field>
      {data.relationType === 'condition' && (
        <Field label="실행 조건">
          <textarea rows="3" value={data.condition || ''} onChange={(event) => change('condition', event.target.value)} />
        </Field>
      )}
      <Field label="관계 프롬프트" hint="AI가 이 연결을 해석하고 실행할 때 지켜야 할 규칙입니다.">
        <textarea className="prompt-input" rows="6" value={data.prompt || ''} onChange={(event) => change('prompt', event.target.value)} />
      </Field>
      <button className="danger-button" type="button" onClick={deleteSelected}>관계 삭제</button>
    </div>
  );
}
