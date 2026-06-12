# AI Flow JSON 규격

## 핵심 개념

AI Flow는 개발 구조가 아니라 **동작의 흐름**을 표현합니다.

- `Box`: 하나의 동작 또는 추상화 단위
- `Relation`: Box 사이에서 Flow가 이동하는 방식
- `Flow`: Box와 Relation으로 구성된 한 장의 흐름
- `Project`: 모든 Flow와 규칙을 포함하는 전체 문서

Box는 프롬프트와 내부 Flow를 각각 또는 동시에 가질 수 있습니다.

## Box 종류

| 값 | 이름 | 의미 |
| --- | --- | --- |
| `function` | 기능 | 입력을 받아 일을 수행하고 출력을 만듭니다. |
| `relay` | 중계 | 받은 정보나 결과를 여러 대상으로 전달합니다. |
| `condition` | 조건 | 판단 규칙에 따라 다음 길을 선택합니다. |
| `loop` | 반복 | 횟수나 종료 조건에 따라 동작을 반복합니다. |
| `schedule` | 스케줄 | 특정 시간이나 주기에 Flow를 시작합니다. |
| `flow` | Flow | 내부에 더 상세한 Flow를 담습니다. |
| `start` | 시작 | Flow의 시작점을 나타냅니다. |
| `end` | 종료 | Flow의 종료점을 나타냅니다. |

### Box JSON

```json
{
  "id": "box-check-order",
  "type": "boxNode",
  "position": { "x": 100, "y": 100 },
  "data": {
    "title": "주문 가능 여부",
    "boxType": "condition",
    "description": "재고와 입력값을 확인합니다.",
    "prompt": "주문 가능 여부를 판단한다.",
    "childFlowId": null,
    "status": "approved",
    "inputs": "주문 정보",
    "outputs": "가능 또는 불가능",
    "conditionRule": "재고가 있고 필수 입력이 유효함",
    "repeatRule": "",
    "scheduleRule": "",
    "acceptanceCriteria": "판단 결과가 하나로 결정됨",
    "executionNote": ""
  }
}
```

`function`과 `relay`는 주로 `inputs`, `outputs`를 사용합니다.

`condition`, `loop`, `schedule`은 각각 `conditionRule`, `repeatRule`,
`scheduleRule`을 사용합니다.

## 관계 종류

| 값 | 이름 | 의미 |
| --- | --- | --- |
| `flow` | 흐르기 | 앞 동작이 끝나면 다음 Box로 이동합니다. |
| `round_trip` | 요청·응답 | 요청을 보내고 응답을 받아 돌아옵니다. |
| `send_end` | 보내고 끝 | 정보를 전달한 뒤 현재 Flow를 끝냅니다. |
| `repeat_request` | 반복 요청 | 주기나 조건에 따라 같은 요청을 반복합니다. |
| `signal` | 신호 | 응답을 기다리지 않고 대상의 실행만 시작합니다. |
| `reference` | 참조 | Flow 이동 없이 정보나 규칙만 참고합니다. |

### Relation JSON

```json
{
  "id": "relation-check-status",
  "source": "box-request",
  "target": "box-service",
  "label": "완료될 때까지 확인",
  "data": {
    "label": "완료될 때까지 확인",
    "relationType": "repeat_request",
    "description": "처리 상태를 반복해서 확인합니다.",
    "prompt": "과도한 요청을 피하고 제한 시간을 지킨다.",
    "repeatRule": "10초마다 요청, 최대 30회",
    "responseRule": ""
  }
}
```

## 계층형 Flow

Box 안에 상세한 설계가 필요하면 `childFlowId`를 지정합니다.

```text
[주문 처리 Flow Box]
        │
        └─ 주문 처리 상세 Flow
             ├─ 주문 정보 받기
             ├─ 주문 가능 여부
             └─ 주문 저장
```

내부 Flow는 자신을 소유한 Box ID를 `parentBoxId`로 가집니다.

## 상태

`draft`, `approved`, `ready`, `running`, `review`, `completed`, `failed`,
`blocked`를 사용합니다.

AI는 기본적으로 `approved` 또는 `ready` 상태의 Box를 실행합니다.

## 검증 규칙

1. 모든 Box에는 이름이 필요합니다.
2. Box에는 프롬프트 또는 내부 Flow가 필요합니다.
3. 조건 Box에는 판단 규칙이 필요합니다.
4. 반복 Box에는 횟수나 종료 조건이 필요합니다.
5. 스케줄 Box에는 시간이나 주기가 필요합니다.
6. 반복 요청 관계에는 반복 규칙이 필요합니다.
7. 요청·응답 관계에는 기다릴 응답을 작성하는 것이 좋습니다.
8. 관계의 시작과 대상 Box는 같은 Flow 안에 있어야 합니다.
9. 내부 Flow와 소유 Box는 서로 일치해야 합니다.

## 이전 규격 변환

기존 저장 데이터는 불러올 때 자동 변환됩니다.

```text
feature/task/interface → function
data                   → relay
decision               → condition
group                  → flow

sequence               → flow
dependency             → round_trip
data/condition         → flow
event                  → signal
reference              → reference
```
