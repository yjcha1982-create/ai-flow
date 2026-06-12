# AI Flow JSON 규격

## 1. 목적

AI Flow는 사람이 검토할 수 있는 시각적 설계와 AI가 실행할 수 있는 작업
규격을 같은 데이터로 표현합니다.

이 규격에서 가장 작은 추상화 단위는 `Box`이며, Box 사이의 의미는
`Relation`으로 표현합니다. Box 내부에 더 상세한 설계가 필요하면 별도의
`Flow`를 만들고 `childFlowId`로 연결합니다.

## 2. Project

```json
{
  "schemaVersion": "1.0",
  "title": "AI Flow Project",
  "rootFlowId": "flow-root",
  "rules": {},
  "flows": {},
  "updatedAt": "2026-06-12T00:00:00.000Z"
}
```

| 필드 | 의미 |
| --- | --- |
| `schemaVersion` | 규격 버전 |
| `title` | 프로젝트 이름 |
| `rootFlowId` | 최상위 Flow ID |
| `rules` | 생성·검증·실행 규칙 |
| `flows` | ID를 키로 사용하는 모든 Flow |
| `updatedAt` | 마지막 변경 시각 |

## 3. Flow

```json
{
  "id": "flow-order",
  "title": "주문 상세 Flow",
  "parentBoxId": "box-order",
  "viewport": { "x": 0, "y": 0, "zoom": 1 },
  "nodes": [],
  "edges": []
}
```

- 루트 Flow의 `parentBoxId`는 `null`입니다.
- 하위 Flow의 `parentBoxId`는 자신을 소유한 Box ID입니다.
- 한 Box는 최대 하나의 직접 하위 Flow를 가집니다.
- 하위 Flow 안의 Box가 다시 하위 Flow를 가지는 것은 허용됩니다.

## 4. Box

```json
{
  "id": "box-order",
  "type": "boxNode",
  "position": { "x": 100, "y": 100 },
  "data": {
    "title": "주문 기능",
    "boxType": "feature",
    "description": "주문 생성과 조회를 담당합니다.",
    "prompt": "주문 기능을 구현하고 테스트한다.",
    "childFlowId": "flow-order",
    "status": "approved",
    "acceptanceCriteria": "주문 생성 성공\n실패 응답 처리",
    "outputs": "변경 파일\n테스트 결과",
    "executionNote": ""
  }
}
```

### Box 타입

| 값 | 용도 |
| --- | --- |
| `feature` | 사용자 기능 또는 큰 요구사항 |
| `task` | 실행 가능한 개발 작업 |
| `decision` | 검증, 판단, 분기 |
| `data` | 저장소, 상태, 데이터 변환 |
| `interface` | 화면, API, 외부 인터페이스 |
| `group` | 여러 Box를 포함하는 상위 개념 |

타입은 Box의 정체성이 아니라 분류 속성입니다. 설계 중 언제든 변경할 수
있습니다.

### 실행 상태

`draft`, `approved`, `ready`, `running`, `review`, `completed`, `failed`,
`blocked`를 사용합니다.

AI는 기본적으로 `approved` 또는 `ready` 상태의 Box만 실행합니다.

## 5. Relation

```json
{
  "id": "relation-validation-save",
  "source": "box-validation",
  "target": "box-save",
  "label": "검증 성공",
  "data": {
    "label": "검증 성공",
    "relationType": "condition",
    "description": "검증 성공 시 저장합니다.",
    "condition": "모든 입력 검증이 성공함",
    "prompt": "검증 실패 시 저장하지 말고 오류를 반환한다."
  }
}
```

### Relation 타입

| 값 | 실행 의미 | 기본 표현 |
| --- | --- | --- |
| `sequence` | 선행 완료 후 실행 | 회색 실선 |
| `dependency` | 선행 결과에 의존 | 보라색 파선 |
| `data` | 산출물 전달 | 녹색 점선과 애니메이션 |
| `condition` | 조건 충족 시 실행 | 주황 복합 파선 |
| `event` | 이벤트 발생 시 실행 | 분홍 실선과 애니메이션 |
| `reference` | 실행 없이 문맥 참조 | 옅은 점선 |

## 6. 기본 검증 규칙

1. 프로젝트에는 유효한 루트 Flow가 있어야 합니다.
2. 모든 Box는 제목을 가져야 합니다.
3. 모든 Box는 프롬프트 또는 하위 Flow 중 하나 이상을 가져야 합니다.
4. Box와 Relation 타입은 허용 목록에 포함되어야 합니다.
5. Relation의 시작점과 대상은 같은 Flow에 존재해야 합니다.
6. 자기 자신을 향하는 Relation은 허용하지 않습니다.
7. 모든 Relation은 라벨을 가져야 합니다.
8. `condition` Relation에는 조건 또는 프롬프트가 필요합니다.
9. 하위 Flow와 소유 Box는 서로 일치해야 합니다.

오류가 있으면 AI 생성 JSON을 프로젝트에 적용할 수 없습니다. 경고는 적용할
수 있지만 실행 전에 수정하는 것이 좋습니다.

## 7. AI 실행 규칙

1. AI는 승인된 Flow를 임의로 변경하지 않습니다.
2. 변경이 필요하면 이유와 수정 JSON을 먼저 제안합니다.
3. Relation의 순서, 의존성, 조건을 지킵니다.
4. 작업 시작과 종료 시 Box 상태 변경안을 기록합니다.
5. 완료 시 변경 파일, 테스트 명령, 결과를 Box 산출물에 연결합니다.
6. 모호하거나 실패한 작업은 `blocked` 또는 `failed`로 표시하고 이유를
   `executionNote`에 기록합니다.
