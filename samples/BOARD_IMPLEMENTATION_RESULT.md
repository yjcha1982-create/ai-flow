# 게시판 Flow 구현 결과

## 구현 결과

완료된 Flow:

- 게시판 전체 Flow
- 게시글 목록 Flow
- 게시글 읽기 Flow
- 게시글 작성·수정 Flow
- 댓글·대댓글 Flow

완료된 주요 Box:

- 게시글 요청 분류
- 최신순 목록, 검색, 페이지 처리
- 게시글 상세와 댓글 트리 구성
- 게시글 작성과 입력 검증
- 작성자 권한 확인 후 수정
- 일반 댓글 작성
- 부모 댓글 검증 후 한 단계 대댓글 작성
- 저장 결과 즉시 화면 반영
- 없는 게시글, 권한, 입력 오류 처리

차단 또는 실패한 Box: 없음

## 구현 방식

- 경로: `/#/board`
- UI: React
- 저장소: 브라우저 `localStorage`
- 저장 키: `ai-flow-board-data`
- 현재 사용자: `김하늘`
- 샘플 초기화: 게시판 상단 `샘플 초기화`

Flow Studio와 게시판 결과를 같은 개발 서버에서 비교할 수 있습니다.

```text
Flow Studio: http://localhost:3000/
게시판 결과: http://localhost:3000/#/board
```

## 변경 파일

- `src/board/BoardApp.js`: 목록, 상세, 편집, 댓글 UI
- `src/board/boardModel.js`: 데이터, 저장, 검색, 권한, 검증 규칙
- `src/board/boardModel.test.js`: 핵심 Flow 규칙 단위 테스트
- `src/board/board.css`: 게시판 전용 디자인
- `src/index.js`: `/board` 진입점
- `src/components/TopBar.js`: 게시판 결과 링크

## 테스트

```bash
npm test -- --watchAll=false
npm run build
```

결과:

- 테스트 스위트 1개 통과
- 단위 테스트 6개 통과
- 프로덕션 빌드 성공

검증 항목:

- 게시글 입력 검증
- 게시글 검색과 최신순 목록
- 작성자만 수정 가능
- 게시글 생성
- 대댓글 깊이 한 단계 제한
- 댓글 트리 구성

## Flow 변경 제안

현재 승인 Flow는 구현에 충분했습니다. 실제 서비스로 확장할 때 다음 Box를
별도 Flow로 추가하는 것이 좋습니다.

- 로그인과 사용자 인증
- 게시글·댓글 삭제
- 서버 API와 데이터베이스
- 낙관적 갱신 실패 시 복구
- 신고와 운영자 관리
