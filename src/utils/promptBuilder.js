import { BOX_STATUSES, BOX_TYPES, RELATION_TYPES } from './projectModel';

function describeRules(project) {
  const rules = project.rules;
  return [
    `규격 버전: ${project.schemaVersion}`,
    `허용 Box 종류: ${rules.allowedBoxTypes.join(', ')}`,
    `허용 관계 종류: ${rules.allowedRelationTypes.join(', ')}`,
    `Box는 프롬프트 또는 내부 Flow 중 하나 이상을 가져야 함: ${rules.requireBoxPromptOrChildFlow}`,
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
    if (data.description) lines.push(`${indent}   하는 일: ${data.description}`);
    if (data.inputs) lines.push(`${indent}   입력: ${data.inputs.replace(/\n/g, ' / ')}`);
    if (data.outputs) lines.push(`${indent}   출력: ${data.outputs.replace(/\n/g, ' / ')}`);
    if (data.conditionRule) lines.push(`${indent}   판단 규칙: ${data.conditionRule}`);
    if (data.repeatRule) lines.push(`${indent}   반복 규칙: ${data.repeatRule}`);
    if (data.scheduleRule) lines.push(`${indent}   스케줄: ${data.scheduleRule}`);
    if (data.prompt) lines.push(`${indent}   프롬프트: ${data.prompt}`);
    if (data.acceptanceCriteria) lines.push(`${indent}   완료 조건: ${data.acceptanceCriteria.replace(/\n/g, ' / ')}`);
    if (data.childFlowId) lines.push(`${indent}   내부 Flow: ${data.childFlowId}`);
  });

  if (flow.edges.length) lines.push(`${indent}이동:`);
  flow.edges.forEach((edge) => {
    const source = flow.nodes.find((node) => node.id === edge.source)?.data.title || edge.source;
    const target = flow.nodes.find((node) => node.id === edge.target)?.data.title || edge.target;
    lines.push(`${indent}- ${source} -> ${target} [${edge.data.relationType}] ${edge.data.label || edge.label || ''}`);
    if (edge.data.responseRule) lines.push(`${indent}  기다릴 응답: ${edge.data.responseRule}`);
    if (edge.data.repeatRule) lines.push(`${indent}  반복 요청 규칙: ${edge.data.repeatRule}`);
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
    '너는 복잡한 요청을 단순한 동작 Flow로 바꾸는 설계자다.',
    '개발 구현 용어보다 사람이 이해할 수 있는 동작과 이동을 중심으로 표현하라.',
    '',
    '[핵심 규칙]',
    '- 모든 추상화 단위는 Box다.',
    '- Box는 기능, 중계, 조건, 반복, 스케줄, Flow, 시작, 종료 중 하나다.',
    '- 기능 Box는 입력을 받아 출력을 만든다.',
    '- 중계 Box는 받은 정보를 여러 곳으로 전달할 수 있다.',
    '- 조건 Box는 판단 규칙에 따라 다음 길을 선택한다.',
    '- 반복 Box는 횟수나 종료 조건에 따라 내부 동작을 반복한다.',
    '- 스케줄 Box는 특정 시간이나 주기에 Flow를 시작한다.',
    '- Flow Box는 내부에 더 상세한 Flow를 가질 수 있다.',
    '- 관계는 흐르기, 요청·응답, 보내고 끝, 반복 요청, 신호, 참조 중 하나다.',
    '- Box와 관계 모두 프롬프트를 가질 수 있다.',
    '',
    '[프로젝트 규칙]',
    describeRules(project),
    '',
    '[Box 종류]',
    ...Object.entries(BOX_TYPES).map(([key, value]) => `- ${key} (${value.label}): ${value.description}`),
    '',
    '[관계 종류]',
    ...Object.entries(RELATION_TYPES).map(([key, value]) => `- ${key} (${value.label}): ${value.description}`),
    '',
    '[사용자 요구사항]',
    request || '(여기에 요구사항을 입력하세요.)',
    '',
    '[현재 프로젝트 JSON]',
    JSON.stringify(project, null, 2),
    '',
    '[응답 규칙]',
    '- 설명문 없이 수정된 전체 프로젝트 JSON만 출력한다.',
    '- schemaVersion은 1.1을 사용한다.',
    '- 개발 기술 이름만으로 Box를 나누지 말고 동작의 차이로 나눈다.',
    '- 조건, 반복, 스케줄에는 각각의 규칙 필드를 작성한다.',
    '- 요청·응답과 반복 요청 관계에는 responseRule 또는 repeatRule을 작성한다.',
    '- 모든 id는 프로젝트 안에서 고유해야 한다.',
  ].join('\n');
}

export function buildExecutionPrompt(project, flowId = project.rootFlowId) {
  const flow = project.flows[flowId];
  return [
    '너는 승인된 AI Flow를 실제 작업으로 수행하는 에이전트다.',
    'Box의 동작과 관계의 이동 방식을 임의로 바꾸지 말고 아래 Flow를 실행하라.',
    '',
    '[실행 규칙]',
    describeRules(project),
    '',
    '[상태 의미]',
    ...Object.entries(BOX_STATUSES).map(([key, label]) => `- ${key}: ${label}`),
    '',
    '[실행할 Flow]',
    describeFlow(project, flow),
    '',
    '[수행 절차]',
    '1. 시작 또는 스케줄 Box에서 Flow를 시작한다.',
    '2. 기능 Box에서는 정의된 입력을 받고 출력을 만든다.',
    '3. 중계 Box에서는 지정된 대상에 결과를 전달한다.',
    '4. 조건 Box에서는 판단 결과에 맞는 관계만 선택한다.',
    '5. 반복 Box와 반복 요청 관계는 종료 조건을 반드시 확인한다.',
    '6. 요청·응답 관계는 지정된 응답이 돌아온 뒤 다음으로 진행한다.',
    '7. 보내고 끝 관계 또는 종료 Box에 도달하면 해당 Flow를 끝낸다.',
    '8. 각 Box의 상태, 입력, 출력, 실행 결과를 보고한다.',
    '9. Flow 변경이 필요하면 실행 전에 수정 JSON과 이유를 제안한다.',
  ].join('\n');
}

export function buildProjectSummaryPrompt(project) {
  return [
    '너는 동작 Flow 검토자다.',
    '다음 Flow가 사람이 이해하기 쉬운지, 끝나지 않는 반복이 있는지, 조건의 길이 빠졌는지, 요청·응답이 모호한지 검토하라.',
    '',
    '[규칙]',
    describeRules(project),
    '',
    '[전체 Flow]',
    describeFlow(project, project.flows[project.rootFlowId]),
  ].join('\n');
}
