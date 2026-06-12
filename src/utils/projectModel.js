export const BOX_TYPES = {
  function: {
    label: '기능',
    description: '입력을 받아 어떤 일을 수행하고 출력을 만듭니다.',
    color: '#3867d6',
  },
  relay: {
    label: '중계',
    description: '받은 정보나 결과를 하나 이상의 다음 대상으로 전달합니다.',
    color: '#00a884',
  },
  condition: {
    label: '조건',
    description: '조건을 판단해 Flow가 진행할 길을 선택합니다.',
    color: '#e88b24',
  },
  loop: {
    label: '반복',
    description: '횟수나 종료 조건에 따라 작업 또는 내부 Flow를 반복합니다.',
    color: '#845ec2',
  },
  schedule: {
    label: '스케줄',
    description: '정해진 시간이나 주기에 Flow를 시작합니다.',
    color: '#d94f70',
  },
  flow: {
    label: 'Flow',
    description: '내부에 더 상세한 Flow를 담는 추상화 Box입니다.',
    color: '#64748b',
  },
  start: {
    label: '시작',
    description: 'Flow가 들어오는 시작점을 나타냅니다.',
    color: '#16a085',
  },
  end: {
    label: '종료',
    description: 'Flow가 끝나는 지점을 나타냅니다.',
    color: '#475569',
  },
};

export const RELATION_TYPES = {
  flow: {
    label: '흐르기',
    description: '앞 Box의 처리가 끝나면 다음 Box로 이동합니다.',
    color: '#64748b',
    strokeDasharray: undefined,
    animated: false,
  },
  round_trip: {
    label: '요청·응답',
    description: '대상에 요청을 보내고 응답을 받아 현재 Flow로 돌아옵니다.',
    color: '#3867d6',
    strokeDasharray: '8 4',
    animated: true,
  },
  send_end: {
    label: '보내고 끝',
    description: '정보를 대상에 전달한 뒤 현재 Flow를 종료합니다.',
    color: '#d94f70',
    strokeDasharray: undefined,
    animated: false,
  },
  repeat_request: {
    label: '반복 요청',
    description: '횟수, 주기 또는 종료 조건에 따라 대상에 다시 요청합니다.',
    color: '#845ec2',
    strokeDasharray: '3 5',
    animated: true,
  },
  signal: {
    label: '신호',
    description: '데이터 응답을 기다리지 않고 대상의 실행만 시작합니다.',
    color: '#e88b24',
    strokeDasharray: '10 4 2 4',
    animated: true,
  },
  reference: {
    label: '참조',
    description: 'Flow를 이동시키지 않고 정보나 규칙만 참고합니다.',
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

const LEGACY_BOX_TYPES = {
  feature: 'function',
  task: 'function',
  decision: 'condition',
  data: 'relay',
  interface: 'function',
  group: 'flow',
};

const LEGACY_RELATION_TYPES = {
  sequence: 'flow',
  dependency: 'round_trip',
  data: 'flow',
  condition: 'flow',
  event: 'signal',
  reference: 'reference',
};

export const DEFAULT_RULES = {
  version: '1.1',
  requireBoxTitle: true,
  requireBoxPromptOrChildFlow: true,
  requireRelationLabel: true,
  preventSelfRelation: true,
  allowedBoxTypes: Object.keys(BOX_TYPES),
  allowedRelationTypes: Object.keys(RELATION_TYPES),
  executionPolicy: [
    'AI는 승인된 Box만 실행한다.',
    'Box의 동작 규칙과 관계의 이동 방식을 그대로 따른다.',
    'Flow를 임의로 변경하지 않고 변경안을 먼저 제안한다.',
    '완료 시 입력, 출력, 실행 결과를 해당 Box에 기록한다.',
    '실패하거나 모호하면 상태를 blocked로 바꾸고 이유를 기록한다.',
  ],
};

export function createBox(id, title, boxType, position, extra = {}) {
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
      inputs: '',
      outputs: '',
      conditionRule: '',
      repeatRule: '',
      scheduleRule: '',
      acceptanceCriteria: '',
      executionNote: '',
      ...extra,
    },
  };
}

export function createInitialProject() {
  const rootFlowId = 'flow-root';
  const detailFlowId = 'flow-order-detail';

  return {
    schemaVersion: '1.1',
    title: 'AI Flow Project',
    rootFlowId,
    rules: DEFAULT_RULES,
    flows: {
      [rootFlowId]: {
        id: rootFlowId,
        title: '주문 처리 Flow',
        parentBoxId: null,
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: [
          createBox('box-start', '주문 요청 시작', 'start', { x: 50, y: 160 }, {
            prompt: '사용자의 주문 요청을 Flow에 전달한다.',
            status: 'approved',
          }),
          createBox('box-order', '주문 처리', 'flow', { x: 340, y: 160 }, {
            prompt: '내부 Flow에 따라 주문을 처리한다.',
            childFlowId: detailFlowId,
            status: 'ready',
          }),
          createBox('box-notify', '결과 전달', 'relay', { x: 630, y: 160 }, {
            prompt: '주문 처리 결과를 사용자와 관련 시스템에 전달한다.',
            inputs: '주문 처리 결과',
            outputs: '사용자 알림\n시스템 알림',
          }),
          createBox('box-end', '처리 종료', 'end', { x: 920, y: 160 }, {
            prompt: '주문 처리 Flow를 종료한다.',
          }),
        ],
        edges: [
          createRelation('relation-start-order', 'box-start', 'box-order', 'flow', '주문 처리로 이동'),
          createRelation('relation-order-notify', 'box-order', 'box-notify', 'flow', '처리 결과 전달'),
          createRelation('relation-notify-end', 'box-notify', 'box-end', 'send_end', '알림 후 종료'),
        ],
      },
      [detailFlowId]: {
        id: detailFlowId,
        title: '주문 처리 상세 Flow',
        parentBoxId: 'box-order',
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: [
          createBox('box-receive-order', '주문 정보 받기', 'function', { x: 60, y: 130 }, {
            prompt: '주문 상품과 결제 정보를 입력으로 받는다.',
            inputs: '상품\n수량\n결제 정보',
            outputs: '주문 정보',
          }),
          createBox('box-order-condition', '주문 가능 여부', 'condition', { x: 350, y: 130 }, {
            prompt: '재고와 입력값을 확인해 주문 가능 여부를 판단한다.',
            conditionRule: '재고가 있고 필수 입력값이 모두 유효함',
          }),
          createBox('box-save-order', '주문 저장', 'function', { x: 650, y: 130 }, {
            prompt: '검증된 주문을 저장하고 주문 ID를 반환한다.',
            inputs: '검증된 주문 정보',
            outputs: '주문 ID',
          }),
        ],
        edges: [
          createRelation('relation-receive-condition', 'box-receive-order', 'box-order-condition', 'flow', '검사로 이동'),
          createRelation('relation-condition-save', 'box-order-condition', 'box-save-order', 'flow', '주문 가능'),
        ],
      },
    },
    updatedAt: new Date().toISOString(),
  };
}

export function createRelation(id, source, target, relationType, label, extra = {}) {
  const visual = RELATION_TYPES[relationType] || RELATION_TYPES.flow;
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
      repeatRule: '',
      responseRule: '',
      ...extra,
    },
  };
}

export function applyRelationVisual(edge, relationType = edge.data?.relationType) {
  const visual = RELATION_TYPES[relationType] || RELATION_TYPES.flow;
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

function migrateBoxType(type) {
  if (BOX_TYPES[type]) return type;
  return LEGACY_BOX_TYPES[type] || 'function';
}

function migrateRelationType(type) {
  if (RELATION_TYPES[type]) return type;
  return LEGACY_RELATION_TYPES[type] || 'flow';
}

export function normalizeProject(value) {
  if (value?.flows && value?.rootFlowId) {
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
              boxType: migrateBoxType(node.data?.boxType),
              prompt: '',
              childFlowId: null,
              inputs: '',
              outputs: '',
              conditionRule: '',
              repeatRule: '',
              scheduleRule: '',
              acceptanceCriteria: '',
              executionNote: '',
              ...node.data,
              boxType: migrateBoxType(node.data?.boxType),
            },
          })),
          edges: (flow.edges || []).map((edge) => {
            const relationType = migrateRelationType(edge.data?.relationType);
            return applyRelationVisual({
              ...edge,
              data: {
                relationType,
                label: edge.data?.label || edge.label || '',
                description: '',
                prompt: '',
                repeatRule: '',
                responseRule: '',
                ...edge.data,
                relationType,
              },
            });
          }),
        },
      ]),
    );

    return {
      ...value,
      schemaVersion: '1.1',
      rules: {
        ...DEFAULT_RULES,
        ...(value.rules || {}),
        version: '1.1',
        allowedBoxTypes: DEFAULT_RULES.allowedBoxTypes,
        allowedRelationTypes: DEFAULT_RULES.allowedRelationTypes,
      },
      flows,
    };
  }

  return createInitialProject();
}
