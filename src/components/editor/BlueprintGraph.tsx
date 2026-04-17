import React, { useMemo } from 'react';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, BackgroundVariant, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Box, Workflow } from 'lucide-react';

interface BlueprintGraphProps {
  blueprint: any;
}

// Custom Node for Unreal Blueprint styling
const CustomNode = ({ data }: any) => {
  return (
    <div className="bg-slate-800/90 border border-slate-600 rounded-lg shadow-lg w-64">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-slate-400 border-2 border-slate-700" />
      <div className="h-2 w-full rounded-t-lg bg-gradient-to-r from-blue-500 to-purple-500"></div>
      <div className="p-3">
        <h4 className="text-slate-200 font-medium text-sm flex items-center gap-2">
          <Box className="w-4 h-4 text-slate-400" />
          {data.label}
        </h4>
        <div className="mt-3 space-y-2">
          {data.properties && Object.entries(data.properties).map(([key, val]) => (
            <div key={key} className="flex justify-between items-center bg-slate-900/50 px-2 py-1 rounded">
              <span className="text-[10px] text-slate-400">{key}</span>
              <span className="text-xs text-green-400 font-mono">{String(val)}</span>
            </div>
          ))}
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-slate-400 border-2 border-slate-700" />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

export default function BlueprintGraph({ blueprint }: BlueprintGraphProps) {
  const initialNodes = useMemo(() => {
    if (!blueprint?.nodes) return [];
    
    return blueprint.nodes.map((node: any, idx: number) => ({
      id: `node-${idx}`,
      type: 'custom',
      position: { x: 250 * idx, y: 100 + (idx % 2 === 0 ? 0 : 150) }, // Auto layout roughly
      data: { 
        label: node.type || 'Node',
        properties: node.properties
      }
    }));
  }, [blueprint]);

  const initialEdges = useMemo(() => {
    if (!blueprint?.nodes || blueprint.nodes.length < 2) return [];
    
    // Auto connect sequentially for demo purposes if no connections array is provided
    const edges = [];
    for (let i = 0; i < blueprint.nodes.length - 1; i++) {
      edges.push({
        id: `e-${i}-${i+1}`,
        source: `node-${i}`,
        target: `node-${i+1}`,
        animated: true,
        style: { stroke: '#a78bfa', strokeWidth: 2 }
      });
    }
    return edges;
  }, [blueprint]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  if (!blueprint) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-slate-500 bg-[#0f111a]">
        <Workflow className="w-12 h-12 mb-4 opacity-50" />
        <p>Nenhuma Blueprint gerada ainda.</p>
        <p className="text-xs mt-2">Peça para a IA gerar uma lógica AAA para Unreal.</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#0f111a] relative">
      <div className="absolute top-4 left-4 z-10 bg-slate-800 border border-blue-500/30 rounded-lg px-4 py-2 shadow-xl">
        <div className="text-blue-400 text-[10px] font-bold uppercase tracking-wider mb-1">
          Event Graph
        </div>
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          <Workflow className="w-4 h-4 text-blue-400" />
          {blueprint.blueprint_name || 'BP_Logic'}
        </h3>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        className="blueprint-theme"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#334155" />
        <Controls className="bg-slate-800 border-slate-700 fill-slate-300" />
        <MiniMap 
          nodeColor={(n) => '#3b82f6'} 
          maskColor="rgba(15, 23, 42, 0.8)"
          className="bg-slate-900 border border-slate-700"
        />
      </ReactFlow>
    </div>
  );
}
