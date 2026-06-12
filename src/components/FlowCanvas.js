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
import {
  BOX_STATUSES,
  BOX_TYPES,
  createRelation,
} from '../utils/projectModel';

const BoxNode = memo(({ data, selected }) => {
  const type = BOX_TYPES[data.boxType] || BOX_TYPES.feature;
  const hasPrompt = Boolean(data.prompt?.trim());
  const hasFlow = Boolean(data.childFlowId);

  return (
    <div
      className={`box-node ${selected ? 'selected' : ''}`}
      style={{ '--box-color': type.color }}
    >
      <Handle type="target" position={Position.Left} />
      <div className="box-node-head">
        <span className="box-type">{type.label}</span>
        <span className={`box-status status-${data.status}`}>
          {BOX_STATUSES[data.status] || data.status}
        </span>
      </div>
      <div className="box-title">{data.title || '제목 없는 Box'}</div>
      <p className="box-description">
        {data.description || data.prompt || '설명 또는 프롬프트를 입력하세요.'}
      </p>
      <div className="box-capabilities">
        <span className={hasPrompt ? 'on' : ''}>P 프롬프트</span>
        <span className={hasFlow ? 'on' : ''}>F 하위 Flow</span>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
});

function FlowInner({
  flow,
  updateNodes,
  updateEdges,
  onInit,
  onSelectBox,
  onSelectRelation,
  onOpenChildFlow,
  onPaneClick,
  onViewportChange,
}) {
  const nodeTypes = useMemo(() => ({ boxNode: BoxNode }), []);
  const handleNodesChange = useCallback(
    (changes) => updateNodes((nodes) => applyNodeChanges(changes, nodes)),
    [updateNodes],
  );
  const handleEdgesChange = useCallback(
    (changes) => updateEdges((edges) => applyEdgeChanges(changes, edges)),
    [updateEdges],
  );
  const handleConnect = useCallback(
    (connection) => {
      const relation = createRelation(
        `relation-${Date.now()}`,
        connection.source,
        connection.target,
        'sequence',
        '새 관계',
      );
      updateEdges((edges) => addEdge({ ...connection, ...relation }, edges));
    },
    [updateEdges],
  );

  return (
    <div className="flow-canvas">
      <ReactFlow
        key={flow.id}
        nodes={flow.nodes}
        edges={flow.edges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onInit={onInit}
        onNodeClick={(_, node) => onSelectBox(node)}
        onNodeDoubleClick={(_, node) => {
          if (node.data.childFlowId) onOpenChildFlow(node.data.childFlowId);
        }}
        onEdgeClick={(_, edge) => onSelectRelation(edge)}
        onPaneClick={onPaneClick}
        onMoveEnd={(_, viewport) => onViewportChange(viewport)}
        defaultViewport={flow.viewport}
        deleteKeyCode={null}
        fitView={flow.nodes.length > 0}
        minZoom={0.25}
        maxZoom={1.8}
      >
        <MiniMap
          className="mini-map"
          nodeColor={(node) =>
            BOX_TYPES[node.data?.boxType]?.color || BOX_TYPES.feature.color
          }
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
