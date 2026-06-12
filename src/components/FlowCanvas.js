import React, { memo, useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlowProvider,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
} from 'react-flow-renderer';

const typeLabels = {
  screen: 'SCREEN',
  component: 'COMPONENT',
  api: 'API',
  state: 'STATE',
  ai_task: 'AI TASK',
};

const DiagramNode = memo(({ data, selected }) => {
  const prompt = data.prompt || '프롬프트를 입력하세요.';

  return (
    <div className={`diagram-node node-${data.nodeType} ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Left} />
      <div className="node-type">{typeLabels[data.nodeType] || data.nodeType}</div>
      <div className="node-title">{data.title || '제목 없음'}</div>
      {data.nodeType === 'api' && data.endpoint && (
        <div className="node-endpoint">
          <strong>{data.method || 'GET'}</strong> {data.endpoint}
        </div>
      )}
      <p className="node-prompt">{prompt}</p>
      <Handle type="source" position={Position.Right} />
    </div>
  );
});

function FlowInner({
  nodes,
  edges,
  setNodes,
  setEdges,
  onInit,
  onSelectNode,
  onSelectEdge,
  onPaneClick,
}) {
  const nodeTypes = useMemo(() => ({ diagramNode: DiagramNode }), []);

  const handleNodesChange = useCallback(
    (changes) => setNodes((current) => applyNodeChanges(changes, current)),
    [setNodes],
  );

  const handleEdgesChange = useCallback(
    (changes) => setEdges((current) => applyEdgeChanges(changes, current)),
    [setEdges],
  );

  const handleConnect = useCallback(
    (connection) => {
      const edge = {
        ...connection,
        id: `edge-${Date.now()}`,
        type: 'default',
        label: '새 관계',
        data: {
          label: '새 관계',
          edgeType: 'flow',
          description: '',
          prompt: '',
        },
      };
      setEdges((current) => addEdge(edge, current));
    },
    [setEdges],
  );

  return (
    <div className="flow-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onInit={onInit}
        onNodeClick={(_, node) => onSelectNode(node)}
        onEdgeClick={(_, edge) => onSelectEdge(edge)}
        onPaneClick={onPaneClick}
        deleteKeyCode={null}
        fitView
        minZoom={0.25}
        maxZoom={1.8}
        defaultEdgeOptions={{ animated: false }}
      >
        <MiniMap
          className="mini-map"
          nodeColor={(node) => `var(--${node.data?.nodeType || 'screen'})`}
        />
        <Controls />
        <Background color="#cbd5e1" gap={24} size={1} />
      </ReactFlow>
    </div>
  );
}

export default function FlowCanvas(props) {
  return (
    <section className="flow-area">
      <ReactFlowProvider>
        <FlowInner {...props} />
      </ReactFlowProvider>
    </section>
  );
}
