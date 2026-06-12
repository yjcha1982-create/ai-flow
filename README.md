# AI Flow Studio

AI가 규칙에 맞는 계층형 Flow를 만들고, 사람이 검토한 Flow를 다시 AI 개발
작업의 실행 규격으로 사용하는 React Flow 프로토타입입니다.

## 실행

`run.bat`을 더블클릭하거나 다음 명령을 실행합니다.

```bash
npm install
npm start
```

프로덕션 빌드:

```bash
npm run build
```

## 핵심 개념

- 모든 추상화 단위는 `Box`입니다.
- Box 타입은 언제든 변경할 수 있습니다.
- Box는 AI 프롬프트와 하위 Flow를 각각 또는 동시에 가질 수 있습니다.
- Relation은 타입에 따라 디자인과 실행 의미가 달라집니다.
- Relation도 AI 프롬프트와 실행 조건을 가질 수 있습니다.
- 전체 프로젝트는 규칙 검사를 통과한 JSON으로 저장됩니다.

## 문서

- [사용 가이드](docs/USER_GUIDE.md)
- [Flow JSON 규격](docs/FLOW_SPEC.md)

## 검증용 샘플

- [게시글·댓글 Flow JSON](samples/board-with-comments.flow.json)
- [게시판 개발 요청 템플릿](samples/BOARD_DEVELOPMENT_REQUEST.md)

브라우저 저장 키는 `ai-flow-project`입니다.
