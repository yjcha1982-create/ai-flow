import { findBox } from './projectModel';

export function validateProject(project) {
  const issues = [];
  const rules = project.rules || {};
  const flows = Object.values(project.flows || {});

  if (!project.rootFlowId || !project.flows?.[project.rootFlowId]) {
    issues.push(issue('error', 'PROJECT_ROOT_MISSING', '루트 Flow가 없습니다.'));
  }

  flows.forEach((flow) => {
    const ids = new Set(flow.nodes.map((node) => node.id));

    flow.nodes.forEach((node) => {
      const data = node.data || {};
      if (rules.requireBoxTitle && !data.title?.trim()) {
        issues.push(issue('error', 'BOX_TITLE_REQUIRED', 'Box 제목이 필요합니다.', flow.id, node.id));
      }
      if (
        rules.requireBoxPromptOrChildFlow &&
        !data.prompt?.trim() &&
        !data.childFlowId
      ) {
        issues.push(issue('warning', 'BOX_CONTENT_REQUIRED', 'Box에는 프롬프트 또는 내부 Flow가 필요합니다.', flow.id, node.id));
      }
      if (!rules.allowedBoxTypes?.includes(data.boxType)) {
        issues.push(issue('error', 'BOX_TYPE_INVALID', `허용되지 않은 Box 타입: ${data.boxType}`, flow.id, node.id));
      }
      if (data.childFlowId && !project.flows[data.childFlowId]) {
        issues.push(issue('error', 'CHILD_FLOW_MISSING', '연결된 내부 Flow를 찾을 수 없습니다.', flow.id, node.id));
      }
      if (data.boxType === 'condition' && !data.conditionRule?.trim()) {
        issues.push(issue('warning', 'CONDITION_RULE_REQUIRED', '조건 Box에는 판단 규칙이 필요합니다.', flow.id, node.id));
      }
      if (data.boxType === 'loop' && !data.repeatRule?.trim()) {
        issues.push(issue('warning', 'LOOP_RULE_REQUIRED', '반복 Box에는 반복 횟수나 종료 조건이 필요합니다.', flow.id, node.id));
      }
      if (data.boxType === 'schedule' && !data.scheduleRule?.trim()) {
        issues.push(issue('warning', 'SCHEDULE_RULE_REQUIRED', '스케줄 Box에는 실행 시간이나 주기가 필요합니다.', flow.id, node.id));
      }
    });

    flow.edges.forEach((edge) => {
      const data = edge.data || {};
      if (!ids.has(edge.source) || !ids.has(edge.target)) {
        issues.push(issue('error', 'RELATION_ENDPOINT_MISSING', '관계의 시작 또는 대상 Box가 없습니다.', flow.id, edge.id));
      }
      if (rules.preventSelfRelation && edge.source === edge.target) {
        issues.push(issue('error', 'SELF_RELATION', 'Box 자신에게 연결할 수 없습니다.', flow.id, edge.id));
      }
      if (rules.requireRelationLabel && !(data.label || edge.label)?.trim()) {
        issues.push(issue('warning', 'RELATION_LABEL_REQUIRED', '관계 라벨이 필요합니다.', flow.id, edge.id));
      }
      if (!rules.allowedRelationTypes?.includes(data.relationType)) {
        issues.push(issue('error', 'RELATION_TYPE_INVALID', `허용되지 않은 관계 타입: ${data.relationType}`, flow.id, edge.id));
      }
      if (data.relationType === 'repeat_request' && !data.repeatRule?.trim()) {
        issues.push(issue('warning', 'REPEAT_REQUEST_RULE_REQUIRED', '반복 요청 관계에는 주기나 종료 조건이 필요합니다.', flow.id, edge.id));
      }
      if (data.relationType === 'round_trip' && !data.responseRule?.trim()) {
        issues.push(issue('warning', 'RESPONSE_RULE_REQUIRED', '요청·응답 관계에는 기다릴 응답을 적는 것이 좋습니다.', flow.id, edge.id));
      }
    });
  });

  flows.forEach((flow) => {
    if (flow.parentBoxId) {
      const owner = findBox(project, flow.parentBoxId);
      if (!owner || owner.box.data.childFlowId !== flow.id) {
        issues.push(issue('error', 'FLOW_OWNER_INVALID', '내부 Flow와 소유 Box 연결이 올바르지 않습니다.', flow.id));
      }
    }
  });

  return {
    valid: !issues.some((item) => item.level === 'error'),
    errors: issues.filter((item) => item.level === 'error').length,
    warnings: issues.filter((item) => item.level === 'warning').length,
    issues,
  };
}

function issue(level, code, message, flowId = null, elementId = null) {
  return { level, code, message, flowId, elementId };
}
