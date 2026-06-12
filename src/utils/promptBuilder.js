export function buildPromptFromDiagram(nodes = [], edges = []) {
  const lines = [
    '너는 프론트엔드 아키텍트야.',
    '',
    '아래는 사용자가 React Flow 캔버스에서 만든 AI UML 구조야.',
    '',
    '[노드 목록]',
    '',
  ];

  nodes.forEach((node, index) => {
    const data = node.data || {};
    lines.push(`${index + 1}. ${data.title || node.id}`);
    lines.push(`- 타입: ${data.nodeType || 'unknown'}`);
    if (data.nodeType === 'api') {
      lines.push(`- API: ${data.method || 'GET'} ${data.endpoint || '(미입력)'}`);
    }
    if (data.description) lines.push(`- 설명: ${data.description}`);
    if (data.prompt) lines.push(`- 프롬프트: ${data.prompt}`);
    if (data.memo) lines.push(`- 메모: ${data.memo}`);
    lines.push('');
  });

  lines.push('[관계 목록]', '');

  edges.forEach((edge, index) => {
    const data = edge.data || {};
    const source =
      nodes.find((node) => node.id === edge.source)?.data?.title || edge.source;
    const target =
      nodes.find((node) => node.id === edge.target)?.data?.title || edge.target;
    lines.push(`${index + 1}. ${source} -> ${target}`);
    lines.push(`- 관계 타입: ${data.edgeType || 'flow'}`);
    if (data.label || edge.label) lines.push(`- 라벨: ${data.label || edge.label}`);
    if (data.description) lines.push(`- 설명: ${data.description}`);
    if (data.prompt) lines.push(`- 프롬프트: ${data.prompt}`);
    lines.push('');
  });

  lines.push(
    '[요청]',
    '이 구조를 기준으로 구현 순서, 컴포넌트와 상태 구조, API 연동 방식, 필요한 코드를 작성해줘.',
  );

  return lines.join('\n');
}
