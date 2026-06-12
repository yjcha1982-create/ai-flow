import React, { useMemo, useState } from 'react';
import {
  buildExecutionPrompt,
  buildFlowGenerationPrompt,
  buildProjectSummaryPrompt,
} from '../utils/promptBuilder';

export default function JsonViewer({
  project,
  activeFlowId,
  validation,
  onCopy,
  onImportProject,
}) {
  const [tab, setTab] = useState('generate');
  const [request, setRequest] = useState('');
  const [responseJson, setResponseJson] = useState('');
  const values = useMemo(
    () => ({
      generate: buildFlowGenerationPrompt(project, request),
      execute: buildExecutionPrompt(project, activeFlowId),
      review: buildProjectSummaryPrompt(project),
      json: JSON.stringify(project, null, 2),
    }),
    [activeFlowId, project, request],
  );

  const loadJsonFile = (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      setResponseJson(text);
      onImportProject(text);
      input.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <section className="ai-workspace">
      <div className="workspace-heading">
        <div>
          <p className="eyebrow">AI WORKSPACE</p>
          <h2>Flow로 AI와 작업하기</h2>
        </div>
        <span className={validation.valid ? 'valid' : 'invalid'}>
          {validation.valid ? '검증 통과' : '실행 전 수정 필요'}
        </span>
      </div>

      <div className="workspace-tabs">
        {[
          ['generate', 'Flow 생성'],
          ['execute', '개발 실행'],
          ['review', '설계 검토'],
          ['validation', '규칙 검사'],
          ['json', 'JSON'],
        ].map(([key, label]) => (
          <button key={key} type="button" className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'generate' && (
        <>
          <label className="request-field">
            <span>AI에게 Flow로 바꿀 요구사항</span>
            <textarea rows="4" value={request} onChange={(event) => setRequest(event.target.value)} placeholder="예: 회원이 상품을 주문하고 결제 결과를 확인하는 기능을 설계해줘." />
          </label>
          <label className="request-field response-field">
            <span>AI가 생성한 프로젝트 JSON</span>
            <textarea rows="5" value={responseJson} onChange={(event) => setResponseJson(event.target.value)} placeholder="AI 응답 JSON을 여기에 붙여넣고 적용하세요." />
          </label>
          <button className="import-project-button" type="button" disabled={!responseJson.trim()} onClick={() => onImportProject(responseJson)}>
            AI Flow JSON 검증 후 적용
          </button>
          <label className="file-import-button">
            JSON 파일 열기
            <input type="file" accept=".json,application/json" onChange={loadJsonFile} />
          </label>
        </>
      )}

      {tab === 'validation' ? (
        <div className="validation-list">
          {validation.issues.length === 0 ? (
            <p className="validation-empty">현재 프로젝트는 모든 규칙을 통과했습니다.</p>
          ) : (
            validation.issues.map((issue, index) => (
              <div key={`${issue.code}-${index}`} className={`validation-item ${issue.level}`}>
                <strong>{issue.level === 'error' ? '오류' : '경고'} · {issue.code}</strong>
                <span>{issue.message}</span>
                {issue.flowId && <small>{issue.flowId} {issue.elementId ? `/ ${issue.elementId}` : ''}</small>}
              </div>
            ))
          )}
        </div>
      ) : (
        <>
          <textarea className="workspace-output" readOnly value={values[tab]} />
          <button className="copy-workspace-button" type="button" onClick={() => onCopy(values[tab])}>
            {tab === 'json' ? '프로젝트 JSON 복사' : 'AI 프롬프트 복사'}
          </button>
        </>
      )}
    </section>
  );
}
