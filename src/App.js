import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FlowCanvas from './components/FlowCanvas';
import JsonViewer from './components/JsonViewer';
import RightPanel from './components/RightPanel';
import TopBar from './components/TopBar';
import { buildPromptFromDiagram } from './utils/promptBuilder';
import { loadDiagram, saveDiagram } from './utils/storage';
import './styles/app.css';

const initialNodes = [
  {
    id: 'screen-product-detail',
    type: 'diagramNode',
    position: { x: 100, y: 100 },
    data: {
      title: '상품 상세 화면',
      nodeType: 'screen',
      description: '상품 정보를 보여주고 장바구니 버튼을 제공합니다.',
      prompt: '상품 ID를 기준으로 상품명, 가격, 수량 정보를 표시합니다.',
      memo: '/product-view/:id',
    },
  },
  {
    id: 'api-add-cart',
    type: 'diagramNode',
    position: { x: 500, y: 100 },
    data: {
      title: '장바구니 추가 API',
      nodeType: 'api',
      method: 'POST',
      endpoint: '/api/cart/add',
      description: '장바구니 추가 요청을 처리합니다.',
      prompt: '장바구니 추가 성공 후 갱신 이벤트를 실행합니다.',
      memo: '',
    },
  },
];

const initialEdges = [
  {
    id: 'edge-product-to-cart',
    source: 'screen-product-detail',
    target: 'api-add-cart',
    type: 'default',
    label: '장바구니 버튼 클릭',
    data: {
      label: '장바구니 버튼 클릭',
      edgeType: 'call',
      description: '사용자가 장바구니 버튼을 클릭하면 API를 호출합니다.',
      prompt: '클릭 이벤트 이후 장바구니 추가 API를 호출합니다.',
    },
  },
];

const nodeDefaults = {
  screen: { title: '화면 노드' },
  component: { title: '컴포넌트 노드' },
  api: { title: 'API 노드', method: 'GET', endpoint: '' },
  state: { title: '상태 노드' },
  ai_task: { title: 'AI 명령 노드' },
};

export default function App() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [showJson, setShowJson] = useState(false);
  const [notice, setNotice] = useState('');
  const flowInstance = useRef(null);
  const noticeTimer = useRef(null);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) || null,
    [nodes, selectedNodeId],
  );
  const selectedEdge = useMemo(
    () => edges.find((edge) => edge.id === selectedEdgeId) || null,
    [edges, selectedEdgeId],
  );

  const notify = useCallback((message) => {
    setNotice(message);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(''), 2400);
  }, []);

  useEffect(() => () => window.clearTimeout(noticeTimer.current), []);

  const clearSelection = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, []);

  const deleteSelected = useCallback(() => {
    if (selectedNodeId) {
      setNodes((current) => current.filter((node) => node.id !== selectedNodeId));
      setEdges((current) =>
        current.filter(
          (edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId,
        ),
      );
      clearSelection();
      return;
    }

    if (selectedEdgeId) {
      setEdges((current) => current.filter((edge) => edge.id !== selectedEdgeId));
      clearSelection();
    }
  }, [clearSelection, selectedEdgeId, selectedNodeId]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const tagName = event.target?.tagName;
      const isEditing =
        tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
      if ((event.key === 'Delete' || event.key === 'Backspace') && !isEditing) {
        deleteSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelected]);

  const handleAddNode = useCallback((nodeType) => {
    const defaults = nodeDefaults[nodeType];
    const id = `${nodeType}-${Date.now()}`;
    const offset = Math.floor(Math.random() * 80);
    setNodes((current) => [
      ...current,
      {
        id,
        type: 'diagramNode',
        position: { x: 260 + offset, y: 160 + offset },
        data: {
          ...defaults,
          nodeType,
          description: '',
          prompt: '',
          memo: '',
        },
      },
    ]);
    setSelectedNodeId(id);
    setSelectedEdgeId(null);
  }, []);

  const handleSave = useCallback(() => {
    const viewport = flowInstance.current?.getViewport() || { x: 0, y: 0, zoom: 1 };
    saveDiagram({
      title: 'AI UML Prototype',
      nodes,
      edges,
      viewport,
      updatedAt: new Date().toISOString(),
    });
    notify('다이어그램을 브라우저에 저장했습니다.');
  }, [edges, nodes, notify]);

  const handleLoad = useCallback(() => {
    const diagram = loadDiagram();
    if (!diagram || !Array.isArray(diagram.nodes)) {
      notify('저장된 다이어그램이 없습니다.');
      return;
    }

    setNodes(
      diagram.nodes.map((node) => ({ ...node, type: node.type || 'diagramNode' })),
    );
    setEdges(Array.isArray(diagram.edges) ? diagram.edges : []);
    clearSelection();
    if (diagram.viewport && flowInstance.current) {
      window.requestAnimationFrame(() =>
        flowInstance.current.setViewport(diagram.viewport),
      );
    }
    notify('저장된 다이어그램을 불러왔습니다.');
  }, [clearSelection, notify]);

  const handleCopyJson = useCallback(async () => {
    const payload = { goal: 'AI UML 구조 데이터', nodes, edges };
    const text = JSON.stringify(payload, null, 2);

    try {
      await navigator.clipboard.writeText(text);
      notify('AI 전달용 JSON을 복사했습니다.');
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
      notify('AI 전달용 JSON을 복사했습니다.');
    }
  }, [edges, nodes, notify]);

  const updateNode = useCallback((id, data) => {
    setNodes((current) =>
      current.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node,
      ),
    );
  }, []);

  const updateEdge = useCallback((id, data) => {
    setEdges((current) =>
      current.map((edge) =>
        edge.id === id
          ? {
              ...edge,
              label: data.label,
              data: { ...edge.data, ...data },
            }
          : edge,
      ),
    );
  }, []);

  return (
    <div className="app-root">
      <TopBar
        onAddNode={handleAddNode}
        onSave={handleSave}
        onLoad={handleLoad}
        onToggleJson={() => setShowJson((current) => !current)}
        onCopyJson={handleCopyJson}
        showJson={showJson}
      />

      <main className="main-area">
        <aside className="left-palette">
          <p className="eyebrow">AI UML</p>
          <h1>Prompt Map</h1>
          <p className="palette-copy">
            화면과 로직의 관계를 연결하고, 각 요소에 AI가 이해할 프롬프트를
            기록하세요.
          </p>

          <div className="legend">
            <h2>노드 타입</h2>
            {Object.keys(nodeDefaults).map((type) => (
              <button key={type} type="button" onClick={() => handleAddNode(type)}>
                <span className={`legend-dot ${type}`} />
                <span>{nodeDefaults[type].title}</span>
                <small>{type}</small>
              </button>
            ))}
          </div>

          <div className="shortcut">
            <span>선택 항목 삭제</span>
            <kbd>Delete</kbd>
          </div>
        </aside>

        <FlowCanvas
          nodes={nodes}
          edges={edges}
          setNodes={setNodes}
          setEdges={setEdges}
          onInit={(instance) => {
            flowInstance.current = instance;
          }}
          onSelectNode={(node) => {
            setSelectedNodeId(node.id);
            setSelectedEdgeId(null);
          }}
          onSelectEdge={(edge) => {
            setSelectedEdgeId(edge.id);
            setSelectedNodeId(null);
          }}
          onPaneClick={clearSelection}
        />

        <aside className="right-panel-area">
          <RightPanel
            selectedNode={selectedNode}
            selectedEdge={selectedEdge}
            updateNode={updateNode}
            updateEdge={updateEdge}
            deleteSelected={deleteSelected}
          />
          {showJson && (
            <JsonViewer
              nodes={nodes}
              edges={edges}
              promptText={buildPromptFromDiagram(nodes, edges)}
            />
          )}
        </aside>
      </main>

      {notice && <div className="notice">{notice}</div>}
    </div>
  );
}
