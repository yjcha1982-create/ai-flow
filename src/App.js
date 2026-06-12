import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FlowCanvas from './components/FlowCanvas';
import FlowExplorer from './components/FlowExplorer';
import FlowHeader from './components/FlowHeader';
import JsonViewer from './components/JsonViewer';
import RightPanel from './components/RightPanel';
import TopBar from './components/TopBar';
import {
  applyRelationVisual,
  createEmptyFlow,
  createInitialProject,
  getFlowPath,
  normalizeProject,
} from './utils/projectModel';
import { loadProject, saveProject } from './utils/storage';
import { validateProject } from './utils/validator';
import './styles/app.css';

function uniqueId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function collectChildFlowIds(project, box) {
  const result = [];
  const visit = (flowId) => {
    const flow = project.flows[flowId];
    if (!flow) return;
    result.push(flowId);
    flow.nodes.forEach((node) => {
      if (node.data.childFlowId) visit(node.data.childFlowId);
    });
  };
  if (box.data.childFlowId) visit(box.data.childFlowId);
  return result;
}

export default function App() {
  const [project, setProject] = useState(() => createInitialProject());
  const [activeFlowId, setActiveFlowId] = useState('flow-root');
  const [selectedBoxId, setSelectedBoxId] = useState(null);
  const [selectedRelationId, setSelectedRelationId] = useState(null);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const noticeTimer = useRef(null);

  const activeFlow = project.flows[activeFlowId] || project.flows[project.rootFlowId];
  const selectedBox = useMemo(
    () => activeFlow?.nodes.find((node) => node.id === selectedBoxId) || null,
    [activeFlow, selectedBoxId],
  );
  const selectedRelation = useMemo(
    () => activeFlow?.edges.find((edge) => edge.id === selectedRelationId) || null,
    [activeFlow, selectedRelationId],
  );
  const validation = useMemo(() => validateProject(project), [project]);
  const flowPath = useMemo(
    () => getFlowPath(project, activeFlow.id),
    [activeFlow.id, project],
  );

  const notify = useCallback((message) => {
    setNotice(message);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(''), 2400);
  }, []);

  useEffect(() => () => window.clearTimeout(noticeTimer.current), []);

  const clearSelection = useCallback(() => {
    setSelectedBoxId(null);
    setSelectedRelationId(null);
  }, []);

  const updateActiveFlow = useCallback(
    (updater) => {
      setProject((current) => {
        const flow = current.flows[activeFlowId];
        if (!flow) return current;
        return {
          ...current,
          flows: {
            ...current.flows,
            [activeFlowId]: updater(flow),
          },
          updatedAt: new Date().toISOString(),
        };
      });
    },
    [activeFlowId],
  );

  const updateNodes = useCallback(
    (updater) => {
      updateActiveFlow((flow) => ({
        ...flow,
        nodes: typeof updater === 'function' ? updater(flow.nodes) : updater,
      }));
    },
    [updateActiveFlow],
  );

  const updateEdges = useCallback(
    (updater) => {
      updateActiveFlow((flow) => ({
        ...flow,
        edges: typeof updater === 'function' ? updater(flow.edges) : updater,
      }));
    },
    [updateActiveFlow],
  );

  const openFlow = useCallback(
    (flowId) => {
      if (!project.flows[flowId]) return;
      setActiveFlowId(flowId);
      clearSelection();
    },
    [clearSelection, project.flows],
  );

  const addBox = useCallback(() => {
    const id = uniqueId('box');
    const offset = activeFlow.nodes.length * 24;
    updateNodes((nodes) => [
      ...nodes,
      {
        id,
        type: 'boxNode',
        position: { x: 160 + (offset % 240), y: 130 + (offset % 180) },
        data: {
          title: '새 Box',
          boxType: 'function',
          description: '',
          prompt: '',
          childFlowId: null,
          status: 'draft',
          acceptanceCriteria: '',
          outputs: '',
          executionNote: '',
        },
      },
    ]);
    setSelectedBoxId(id);
    setSelectedRelationId(null);
  }, [activeFlow.nodes.length, updateNodes]);

  const updateBox = useCallback(
    (boxId, data) => {
      updateNodes((nodes) =>
        nodes.map((node) =>
          node.id === boxId
            ? { ...node, data: { ...node.data, ...data } }
            : node,
        ),
      );
    },
    [updateNodes],
  );

  const updateRelation = useCallback(
    (relationId, data) => {
      updateEdges((edges) =>
        edges.map((edge) => {
          if (edge.id !== relationId) return edge;
          return applyRelationVisual(
            {
              ...edge,
              label: data.label,
              data: { ...edge.data, ...data },
            },
            data.relationType,
          );
        }),
      );
    },
    [updateEdges],
  );

  const createChildFlow = useCallback(
    (boxId) => {
      const owner = activeFlow.nodes.find((node) => node.id === boxId);
      if (!owner || owner.data.childFlowId) return;
      const flowId = uniqueId('flow');
      const flow = createEmptyFlow(flowId, `${owner.data.title} 상세 Flow`, boxId);

      setProject((current) => ({
        ...current,
        flows: {
          ...current.flows,
          [activeFlowId]: {
            ...current.flows[activeFlowId],
            nodes: current.flows[activeFlowId].nodes.map((node) =>
              node.id === boxId
                ? { ...node, data: { ...node.data, childFlowId: flowId } }
                : node,
            ),
          },
          [flowId]: flow,
        },
        updatedAt: new Date().toISOString(),
      }));
      setActiveFlowId(flowId);
      clearSelection();
      notify('Box의 내부 Flow를 만들었습니다.');
    },
    [activeFlow.nodes, activeFlowId, clearSelection, notify],
  );

  const addFlowFromExplorer = useCallback(() => {
    const boxId = uniqueId('box');
    const flowId = uniqueId('flow');
    const flowNumber = Object.keys(project.flows).length + 1;
    const title = `새 Flow ${flowNumber}`;
    const offset = activeFlow.nodes.length * 24;
    const ownerBox = {
      id: boxId,
      type: 'boxNode',
      position: { x: 160 + (offset % 240), y: 130 + (offset % 180) },
      data: {
        title,
        boxType: 'flow',
        description: '하위 Flow를 포함하는 Box입니다.',
        prompt: '',
        childFlowId: flowId,
        status: 'draft',
        acceptanceCriteria: '',
        outputs: '',
        executionNote: '',
      },
    };

    setProject((current) => ({
      ...current,
      flows: {
        ...current.flows,
        [activeFlowId]: {
          ...current.flows[activeFlowId],
          nodes: [...current.flows[activeFlowId].nodes, ownerBox],
        },
        [flowId]: createEmptyFlow(flowId, title, boxId),
      },
      updatedAt: new Date().toISOString(),
    }));
    setActiveFlowId(flowId);
    clearSelection();
    notify(`${title}를 추가했습니다.`);
  }, [
    activeFlow.nodes.length,
    activeFlowId,
    clearSelection,
    notify,
    project.flows,
  ]);

  const deleteSelected = useCallback(() => {
    if (selectedBox) {
      const childFlowIds = collectChildFlowIds(project, selectedBox);
      setProject((current) => {
        const flows = { ...current.flows };
        childFlowIds.forEach((flowId) => delete flows[flowId]);
        flows[activeFlowId] = {
          ...flows[activeFlowId],
          nodes: flows[activeFlowId].nodes.filter((node) => node.id !== selectedBox.id),
          edges: flows[activeFlowId].edges.filter(
            (edge) => edge.source !== selectedBox.id && edge.target !== selectedBox.id,
          ),
        };
        return { ...current, flows, updatedAt: new Date().toISOString() };
      });
      clearSelection();
      return;
    }

    if (selectedRelation) {
      updateEdges((edges) => edges.filter((edge) => edge.id !== selectedRelation.id));
      clearSelection();
    }
  }, [
    activeFlowId,
    clearSelection,
    project,
    selectedBox,
    selectedRelation,
    updateEdges,
  ]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const tagName = event.target?.tagName;
      const editing =
        tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
      if (!editing && (event.key === 'Delete' || event.key === 'Backspace')) {
        deleteSelected();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelected]);

  const copyText = useCallback(
    async (text, message = '클립보드에 복사했습니다.') => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      notify(message);
    },
    [notify],
  );

  const save = useCallback(() => {
    saveProject({ ...project, updatedAt: new Date().toISOString() });
    notify('전체 프로젝트와 하위 Flow를 저장했습니다.');
  }, [notify, project]);

  const load = useCallback(() => {
    const loaded = loadProject();
    if (!loaded) {
      notify('저장된 AI Flow 프로젝트가 없습니다.');
      return;
    }
    const normalized = normalizeProject(loaded);
    setProject(normalized);
    setActiveFlowId(normalized.rootFlowId);
    clearSelection();
    notify('저장된 프로젝트를 불러왔습니다.');
  }, [clearSelection, notify]);

  const importProject = useCallback(
    (text) => {
      try {
        const parsed = JSON.parse(text);
        if (!parsed?.schemaVersion || !parsed?.rootFlowId || !parsed?.flows) {
          notify('프로젝트 JSON 규격이 아닙니다.');
          return;
        }
        const normalized = normalizeProject(parsed);
        const result = validateProject(normalized);
        if (result.errors > 0) {
          notify(`규칙 오류 ${result.errors}개가 있어 적용하지 않았습니다.`);
          return;
        }
        setProject(normalized);
        setActiveFlowId(normalized.rootFlowId);
        clearSelection();
        notify(`AI Flow를 적용했습니다. 경고 ${result.warnings}개`);
      } catch {
        notify('JSON 문법을 확인해 주세요.');
      }
    },
    [clearSelection, notify],
  );

  return (
    <div className="app-root">
      <TopBar
        onAddBox={addBox}
        onSave={save}
        onLoad={load}
        onToggleWorkspace={() => setWorkspaceOpen((open) => !open)}
        onCopyProject={() =>
          copyText(JSON.stringify(project, null, 2), '전체 프로젝트 JSON을 복사했습니다.')
        }
        workspaceOpen={workspaceOpen}
      />

      <main className="main-area">
        <FlowExplorer
          project={project}
          activeFlowId={activeFlow.id}
          onOpenFlow={openFlow}
          onAddFlow={addFlowFromExplorer}
          validation={validation}
        />

        <section className="canvas-column">
          <FlowHeader
            path={flowPath}
            validation={validation}
            onOpenFlow={openFlow}
          />
          <FlowCanvas
            flow={activeFlow}
            updateNodes={updateNodes}
            updateEdges={updateEdges}
            onSelectBox={(box) => {
              setSelectedBoxId(box.id);
              setSelectedRelationId(null);
            }}
            onSelectRelation={(relation) => {
              setSelectedRelationId(relation.id);
              setSelectedBoxId(null);
            }}
            onOpenChildFlow={openFlow}
            onPaneClick={clearSelection}
            onViewportChange={(viewport) =>
              updateActiveFlow((flow) => ({ ...flow, viewport }))
            }
          />
        </section>

        <aside className="right-panel-area">
          {workspaceOpen ? (
            <JsonViewer
              project={project}
              activeFlowId={activeFlow.id}
              validation={validation}
              onCopy={copyText}
              onImportProject={importProject}
            />
          ) : (
            <RightPanel
              selectedBox={selectedBox}
              selectedRelation={selectedRelation}
              updateBox={updateBox}
              updateRelation={updateRelation}
              deleteSelected={deleteSelected}
              createChildFlow={createChildFlow}
              openChildFlow={openFlow}
            />
          )}
        </aside>
      </main>

      {notice && <div className="notice">{notice}</div>}
    </div>
  );
}
