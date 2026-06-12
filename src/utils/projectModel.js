export const BOX_TYPES = {
  feature: { label: '기능', color: '#3867d6' },
  task: { label: '작업', color: '#845ec2' },
  decision: { label: '판단', color: '#e88b24' },
  data: { label: '데이터', color: '#00a884' },
  interface: { label: '인터페이스', color: '#d94f70' },
  group: { label: '그룹', color: '#64748b' },
};

export const RELATION_TYPES = {
  sequence: {
    label: '순서',
    description: '선행 Box가 끝난 다음 대상 Box를 실행합니다.',
    color: '#64748b',
    strokeDasharray: undefined,
    animated: false,
  },
  dependency: {
    label: '의존',
    description: '대상 Box가 선행 Box의 결과에 의존합니다.',
    color: '#845ec2',
    strokeDasharray: '7 5',
    animated: false,
  },
  data: {
    label: '데이터',
    description: '선행 Box의 산출물을 대상 Box에 전달합니다.',
    color: '#008f73',
    strokeDasharray: '2 5',
    animated: true,
  },
  condition: {
    label: '조건',
    description: '조건이 충족될 때만 대상 Box를 실행합니다.',
    color: '#d97706',
    strokeDasharray: '10 4 2 4',
    animated: false,
  },
  event: {
    label: '이벤트',
    description: '이벤트가 발생하면 대상 Box를 시작합니다.',
    color: '#d94f70',
    strokeDasharray: undefined,
    animated: true,
  },
  reference: {
    label: '참조',
    description: '실행 순서 없이 문맥이나 규칙만 참조합니다.',
    color: '#94a3b8',
    strokeDasharray: '1 6',
    animated: false,
  },
};

export const BOX_STATUSES = {
  draft: '초안',
  approved: '승인',
  ready: '실행 대기',
  running: '진행 중',
  review: '검토',
  completed: '완료',
  failed: '실패',
  blocked: '차단',
};

export const DEFAULT_RULES = {
  version: '1.0',
  requireBoxTitle: true,
  requireBoxPromptOrChildFlow: true,
  requireRelationLabel: true,
  requireConditionPrompt: true,
  preventSelfRelation: true,
  allowedBoxTypes: Object.keys(BOX_TYPES),
  allowedRelationTypes: Object.keys(RELATION_TYPES),
  executionPolicy: [
    'AI는 승인된 Box만 실행한다.',
    '선행 관계와 조건 관계를 먼저 확인한다.',
    'Flow를 임의로 변경하지 않고 변경안을 제안한다.',
    '완료 시 변경 파일, 테스트 결과, 산출물을 기록한다.',
    '실패하거나 모호하면 상태를 blocked로 바꾸고 이유를 기록한다.',
  ],
};

function createBox(id, title, boxType, position, extra = {}) {
  return {
    id,
    type: 'boxNode',
    position,
    data: {
      title,
      boxType,
      description: '',
      prompt: '',
      childFlowId: null,
      status: 'draft',
      acceptanceCriteria: '',
      outputs: '',
      executionNote: '',
      ...extra,
    },
  };
}

export function createInitialProject() {
  const rootFlowId = 'flow-root';
  const detailFlowId = 'flow-order-detail';

  return {
    schemaVersion: '1.0',
    title: 'AI Flow Project',
    rootFlowId,
    rules: DEFAULT_RULES,
    flows: {
      [rootFlowId]: {
        id: rootFlowId,
        title: '서비스 개발 Flow',
        parentBoxId: null,
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: [
          createBox('box-requirement', '요구사항 분석', 'feature', { x: 80, y: 160 }, {
            prompt: '사용자의 요청을 기능, 제약 조건, 완료 조건으로 분해한다.',
            status: 'approved',
          }),
          createBox('box-order', '주문 기능 개발', 'group', { x: 390, y: 160 }, {
            prompt: '주문 기능을 하위 Flow의 순서와 규칙에 따라 구현한다.',
            childFlowId: detailFlowId,
            status: 'ready',
          }),
          createBox('box-verification', '통합 검증', 'task', { x: 700, y: 160 }, {
            prompt: '전체 테스트를 실행하고 완료 조건을 검증한다.',
            acceptanceCriteria: '빌드 성공\n핵심 사용자 시나리오 통과',
          }),
        ],
        edges: [
          createRelation('relation-analysis-order', 'box-requirement', 'box-order', 'sequence', '분석 승인 후 개발'),
          createRelation('relation-order-test', 'box-order', 'box-verification', 'dependency', '개발 결과 검증'),
        ],
      },
      [detailFlowId]: {
        id: detailFlowId,
        title: '주문 기능 상세 Flow',
        parentBoxId: 'box-order',
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: [
          createBox('box-order-ui', '주문 화면', 'interface', { x: 80, y: 130 }, {
            prompt: '주문 상품과 결제 정보를 입력하는 화면을 구현한다.',
          }),
          createBox('box-order-validation', '주문 검증', 'decision', { x: 380, y: 130 }, {
            prompt: '재고, 수량, 사용자 입력을 검증한다.',
          }),
          createBox('box-order-save', '주문 저장', 'data', { x: 680, y: 130 }, {
            prompt: '검증된 주문을 저장하고 주문 ID를 반환한다.',
          }),
        ],
        edges: [
          createRelation('relation-ui-validation', 'box-order-ui', 'box-order-validation', 'data', '주문 정보 전달'),
          createRelation('relation-validation-save', 'box-order-validation', 'box-order-save', 'condition', '검증 성공', {
            prompt: '모든 검증 조건을 통과한 경우에만 저장한다.',
          }),
        ],
      },
    },
    updatedAt: new Date().toISOString(),
  };
}

export function createRelation(id, source, target, relationType, label, extra = {}) {
  const visual = RELATION_TYPES[relationType] || RELATION_TYPES.sequence;
  return {
    id,
    source,
    target,
    type: 'default',
    label,
    animated: visual.animated,
    style: {
      stroke: visual.color,
      strokeWidth: 2,
      strokeDasharray: visual.strokeDasharray,
    },
    labelStyle: { fill: visual.color, fontWeight: 600 },
    data: {
      label,
      relationType,
      description: '',
      prompt: '',
      condition: '',
      ...extra,
    },
  };
}

export function applyRelationVisual(edge, relationType = edge.data?.relationType) {
  const visual = RELATION_TYPES[relationType] || RELATION_TYPES.sequence;
  return {
    ...edge,
    animated: visual.animated,
    style: {
      ...edge.style,
      stroke: visual.color,
      strokeWidth: 2,
      strokeDasharray: visual.strokeDasharray,
    },
    labelStyle: { fill: visual.color, fontWeight: 600 },
  };
}

export function createEmptyFlow(id, title, parentBoxId) {
  return {
    id,
    title,
    parentBoxId,
    viewport: { x: 0, y: 0, zoom: 1 },
    nodes: [],
    edges: [],
  };
}

export function findBox(project, boxId) {
  for (const flow of Object.values(project.flows || {})) {
    const box = flow.nodes.find((node) => node.id === boxId);
    if (box) return { box, flow };
  }
  return null;
}

export function getFlowPath(project, flowId) {
  const path = [];
  let flow = project.flows[flowId];
  const visited = new Set();

  while (flow && !visited.has(flow.id)) {
    visited.add(flow.id);
    path.unshift(flow);
    if (!flow.parentBoxId) break;
    const parent = findBox(project, flow.parentBoxId);
    flow = parent?.flow;
  }

  return path;
}

export function normalizeProject(value) {
  if (value?.schemaVersion && value?.flows && value?.rootFlowId) {
    const flows = Object.fromEntries(
      Object.entries(value.flows).map(([id, flow]) => [
        id,
        {
          ...flow,
          nodes: (flow.nodes || []).map((node) => ({
            ...node,
            type: 'boxNode',
            data: {
              status: 'draft',
              boxType: 'feature',
              prompt: '',
              childFlowId: null,
              acceptanceCriteria: '',
              outputs: '',
              executionNote: '',
              ...node.data,
            },
          })),
          edges: (flow.edges || []).map((edge) =>
            applyRelationVisual({
              ...edge,
              data: {
                relationType: edge.data?.relationType || 'sequence',
                label: edge.data?.label || edge.label || '',
                description: '',
                prompt: '',
                condition: '',
                ...edge.data,
              },
            }),
          ),
        },
      ]),
    );
    return { ...value, rules: { ...DEFAULT_RULES, ...value.rules }, flows };
  }

  return createInitialProject();
}
