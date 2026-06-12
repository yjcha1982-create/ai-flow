import { BOX_STATUSES, BOX_TYPES, RELATION_TYPES } from './projectModel';

function describeRules(project) {
  const rules = project.rules;
  return [
    `규격 버전: ${project.schemaVersion}`,
    `허용 Box 타입: ${rules.allowedBoxTypes.join(', ')}`,
    `허용 관계 타입: ${rules.allowedRelationTypes.join(', ')}`,
    `Box는 프롬프트 또는 하위 Flow 중 하나 이상을 가져야 함: ${rules.requireBoxPromptOrChildFlow}`,
    `조건 관계는 조건 설명이 필요함: ${rules.requireConditionPrompt}`,
    ...rules.executionPolicy.map((policy) => `- ${policy}`),
  ].join('\n');
}

function describeFlow(project, flow, depth = 0, visited = new Set()) {
  if (!flow || visited.has(flow.id)) return '';
  visited.add(flow.id);
  const indent = '  '.repeat(depth);
  const lines = [`${indent}[Flow] ${flow.title} (${flow.id})`];

  flow.nodes.forEach((node, index) => {
    const data = node.data;
    lines.push(`${indent}${index + 1}. ${data.title} [${data.boxType}/${data.status}]`);
    if (data.description) lines.push(`${indent}   설명: ${data.description}`);
    if (data.prompt) lines.push(`${indent}   프롬프트: ${data.prompt}`);
    if (data.acceptanceCriteria) lines.push(`${indent}   완료 조건: ${data.acceptanceCriteria.replace(/\n/g, ' / ')}`);
    if (data.outputs) lines.push(`${indent}   기대 산출물: ${data.outputs.replace(/\n/g, ' / ')}`);
    if (data.childFlowId) lines.push(`${indent}   하위 Flow: ${data.childFlowId}`);
  });

  if (flow.edges.length) lines.push(`${indent}관계:`);
  flow.edges.forEach((edge) => {
    const source = flow.nodes.find((node) => node.id === edge.source)?.data.title || edge.source;
    const target = flow.nodes.find((node) => node.id === edge.target)?.data.title || edge.target;
    lines.push(`${indent}- ${source} -> ${target} [${edge.data.relationType}] ${edge.data.label || edge.label || ''}`);
    if (edge.data.prompt) lines.push(`${indent}  관계 프롬프트: ${edge.data.prompt}`);
  });

  flow.nodes.forEach((node) => {
    if (node.data.childFlowId) {
      const child = describeFlow(project, project.flows[node.data.childFlowId], depth + 1, visited);
      if (child) lines.push('', child);
    }
  });

  return lines.join('\n');
}

export function buildFlowGenerationPrompt(project, request = '') {
  return [
    '너는 AI Flow 설계자다.',
    '사용자 요구사항을 아래 규격을 준수하는 계층형 Flow JSON으로 변환하라.',
    '',
    '[핵심 개념]',
    '- 모든 추상화 단위는 Box다.',
    '- Box 타입은 변경 가능한 분류 속성이다.',
    '- Box는 prompt와 childFlowId를 각각 또는 동시에 가질 수 있다.',
    '- Relation은 실행 의미를 가지며 prompt를 가질 수 있다.',
    '- 큰 Box는 하위 Flow로 분해하되 불필요하게 세분화하지 않는다.',
    '',
    '[규칙]',
    describeRules(project),
    '',
    '[Box 타입 의미]',
    ...Object.entries(BOX_TYPES).map(([key, value]) => `- ${key}: ${value.label}`),
    '',
    '[관계 타입 의미]',
    ...Object.entries(RELATION_TYPES).map(([key, value]) => `- ${key}: ${value.description}`),
    '',
    '[사용자 요구사항]',
    request || '(여기에 요구사항을 입력하세요.)',
    '',
    '[현재 프로젝트 JSON]',
    JSON.stringify(project, null, 2),
    '',
    '[응답 규칙]',
    '- 설명문 없이 JSON만 출력한다.',
    '- 현재 프로젝트를 요구사항에 맞게 수정한 전체 프로젝트 JSON을 출력한다.',
    '- schemaVersion, title, rootFlowId, rules, flows를 유지한다.',
    '- 모든 id는 고유해야 한다.',
    '- position, data, source, target을 포함한다.',
    '- 모호한 사항은 각 Box의 description 또는 prompt에 명확히 기록한다.',
  ].join('\n');
}

export function buildExecutionPrompt(project, flowId = project.rootFlowId) {
  const flow = project.flows[flowId];
  return [
    '너는 Flow 규격을 준수하는 개발 에이전트다.',
    '아래 승인된 Flow를 기준으로 실제 개발 작업을 수행하라.',
    '',
    '[실행 규칙]',
    describeRules(project),
    '',
    '[상태 의미]',
    ...Object.entries(BOX_STATUSES).map(([key, label]) => `- ${key}: ${label}`),
    '',
    '[Flow]',
    describeFlow(project, flow),
    '',
    '[수행 절차]',
    '1. 규칙 위반과 모호한 조건을 먼저 보고한다.',
    '2. approved 또는 ready 상태의 Box를 관계 순서대로 수행한다.',
    '3. 각 Box 시작/완료 시 상태와 executionNote 갱신안을 제시한다.',
    '4. 변경 파일, 테스트 명령, 테스트 결과를 Box 산출물에 연결한다.',
    '5. Flow 변경이 필요하면 실행 전에 변경 이유와 수정 JSON을 제시한다.',
    '6. 마지막에 완료/실패/차단 Box와 남은 작업을 요약한다.',
  ].join('\n');
}

export function buildProjectSummaryPrompt(project) {
  return [
    '너는 소프트웨어 아키텍트다.',
    '다음 계층형 Flow를 검토하고 누락, 순환 의존, 모호한 조건, 과도한 추상화를 찾아라.',
    '',
    '[규칙]',
    describeRules(project),
    '',
    '[전체 Flow]',
    describeFlow(project, project.flows[project.rootFlowId]),
  ].join('\n');
}
