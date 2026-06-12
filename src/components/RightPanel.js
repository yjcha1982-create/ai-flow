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
          Box는 하나의 동작을 나타내고, 관계는 동작 사이에서 Flow가 이동하는
          방식을 나타냅니다.
        </p>
      </div>
    );
  }

  if (selectedBox) {
    const data = selectedBox.data;
    const type = BOX_TYPES[data.boxType] || BOX_TYPES.function;
    const change = (key, value) => updateBox(selectedBox.id, { [key]: value });
    const showInputOutput = ['function', 'relay'].includes(data.boxType);

    return (
      <div className="right-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">BOX INSPECTOR</p>
            <h2>Box 동작</h2>
          </div>
          <span className="type-chip" style={{ color: type.color }}>
            {type.label}
          </span>
        </div>

        <Field label="이름">
          <input value={data.title || ''} onChange={(event) => change('title', event.target.value)} />
        </Field>
        <div className="field-row equal">
          <Field label="동작 종류" hint={type.description}>
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
        <Field label="이 Box가 하는 일">
          <textarea rows="3" value={data.description || ''} onChange={(event) => change('description', event.target.value)} />
        </Field>

        {showInputOutput && (
          <div className="field-row equal">
            <Field label="입력" hint="이 Box가 받는 정보">
              <textarea rows="4" value={data.inputs || ''} onChange={(event) => change('inputs', event.target.value)} />
            </Field>
            <Field label="출력" hint="이 Box가 만들어 보내는 결과">
              <textarea rows="4" value={data.outputs || ''} onChange={(event) => change('outputs', event.target.value)} />
            </Field>
          </div>
        )}

        {data.boxType === 'condition' && (
          <Field label="판단 규칙" hint="어떤 조건으로 다음 길을 선택하는지 작성합니다.">
            <textarea rows="4" value={data.conditionRule || ''} onChange={(event) => change('conditionRule', event.target.value)} />
          </Field>
        )}
        {data.boxType === 'loop' && (
          <Field label="반복 규칙" hint="횟수, 반복 주기, 멈추는 조건을 작성합니다.">
            <textarea rows="4" value={data.repeatRule || ''} onChange={(event) => change('repeatRule', event.target.value)} />
          </Field>
        )}
        {data.boxType === 'schedule' && (
          <Field label="스케줄 규칙" hint="언제 또는 얼마나 자주 실행할지 작성합니다.">
            <textarea rows="4" value={data.scheduleRule || ''} onChange={(event) => change('scheduleRule', event.target.value)} placeholder="예: 매일 오전 9시" />
          </Field>
        )}

        <Field label="AI 프롬프트" hint="AI가 이 동작을 수행할 때 지켜야 할 내용을 작성합니다.">
          <textarea className="prompt-input" rows="6" value={data.prompt || ''} onChange={(event) => change('prompt', event.target.value)} />
        </Field>
        <Field label="완료 조건" hint="이 동작이 끝났다고 판단할 기준입니다.">
          <textarea rows="4" value={data.acceptanceCriteria || ''} onChange={(event) => change('acceptanceCriteria', event.target.value)} />
        </Field>
        <Field label="실행 기록">
          <textarea rows="3" value={data.executionNote || ''} onChange={(event) => change('executionNote', event.target.value)} />
        </Field>

        <div className="child-flow-card">
          <div>
            <strong>내부 Flow</strong>
            <span>{data.childFlowId ? '이 Box 안에 상세 Flow가 있습니다.' : '동작을 더 자세히 나누고 싶을 때 사용합니다.'}</span>
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
  const type = RELATION_TYPES[data.relationType] || RELATION_TYPES.flow;
  const change = (key, value) =>
    updateRelation(selectedRelation.id, { ...data, [key]: value });

  return (
    <div className="right-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">RELATION INSPECTOR</p>
          <h2>Flow 이동 방식</h2>
        </div>
        <span className="type-chip edge">{type.label}</span>
      </div>

      <Field label="이동 방식" hint={type.description}>
        <select value={data.relationType || 'flow'} onChange={(event) => change('relationType', event.target.value)}>
          {Object.entries(RELATION_TYPES).map(([key, value]) => (
            <option key={key} value={key}>{value.label}</option>
          ))}
        </select>
      </Field>
      <Field label="선에 표시할 말">
        <input value={data.label || selectedRelation.label || ''} onChange={(event) => change('label', event.target.value)} />
      </Field>
      <Field label="이동 설명">
        <textarea rows="3" value={data.description || ''} onChange={(event) => change('description', event.target.value)} />
      </Field>

      {data.relationType === 'round_trip' && (
        <Field label="기다릴 응답" hint="어떤 결과가 돌아오면 다음으로 진행하는지 작성합니다.">
          <textarea rows="3" value={data.responseRule || ''} onChange={(event) => change('responseRule', event.target.value)} />
        </Field>
      )}
      {data.relationType === 'repeat_request' && (
        <Field label="반복 요청 규칙" hint="요청 주기, 횟수, 멈추는 조건을 작성합니다.">
          <textarea rows="4" value={data.repeatRule || ''} onChange={(event) => change('repeatRule', event.target.value)} />
        </Field>
      )}

      <Field label="관계 프롬프트" hint="AI가 이 이동을 처리할 때 지켜야 할 내용을 작성합니다.">
        <textarea className="prompt-input" rows="6" value={data.prompt || ''} onChange={(event) => change('prompt', event.target.value)} />
      </Field>
      <button className="danger-button" type="button" onClick={deleteSelected}>관계 삭제</button>
    </div>
  );
}
