"use client";

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  type NodeTypes,
  type Node,
  type OnNodeDrag,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { nanoid } from "nanoid";
import { Menu, X } from "lucide-react";

import { WarehouseNode } from "./nodes/warehouse-node";
import { ElementNode } from "./nodes/element-node";
import { ZoneNode } from "./nodes/zone-node";
import { StructureNode } from "./nodes/structure-node";
import { SidePanel } from "./side-panel";

import {
  GRID_SIZE,
  type ElementData,
  type WarehouseData,
  type ZoneType,
  type StructureType,
} from "./types";
import {
  createWarehouseNode,
  createElementNode,
  createZoneNode,
  createStructureNode,
} from "./utils";

const nodeTypes: NodeTypes = {
  warehouse: WarehouseNode,
  element: ElementNode,
  zone: ZoneNode,
  structure: StructureNode,
};

export function WarehouseCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isEditingWarehouse, setIsEditingWarehouse] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedPartition, setSelectedPartition] = useState<{ partition: Record<string, unknown>; structureId: string; levelId: string } | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const warehouseNode = useMemo(
    () => nodes.find((n) => n.type === "warehouse"),
    [nodes]
  );

  const warehouseData = warehouseNode?.data as WarehouseData | null;
  const warehouseExists = !!warehouseNode;

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  const zones = useMemo(
    () => nodes.filter((n) => n.type === "zone"),
    [nodes]
  );

  // Create or update warehouse
  const handleCreateWarehouse = useCallback(
    (data: { name: string; width: number; height: number; length: number }) => {
      if (warehouseExists) {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === "warehouse"
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    label: data.name,
                    width: data.width,
                    height: data.height,
                    length: data.length,
                  },
                  style: { ...n.style, width: data.width, height: data.height },
                }
              : n
          )
        );
        setIsEditingWarehouse(false);
      } else {
        const node = createWarehouseNode(data);
        setNodes([node]);
        setIsEditingWarehouse(false);
      }
    },
    [warehouseExists, setNodes]
  );

  // Add internal elements (walls, gutters, walkways, gates)
  const handleAddElement = useCallback(
    (type: ElementData["elementType"], parentId?: string) => {
      if (!warehouseNode) return;
      const resolvedParentId = parentId || "warehouse";
      const parentNode =
        resolvedParentId !== "warehouse"
          ? nodes.find((n) => n.id === resolvedParentId)
          : warehouseNode;
      if (!parentNode) return;
      const pStyle = parentNode.style || {};
      const pw = (pStyle.width as number) || 800;
      const ph = (pStyle.height as number) || 600;
      const newNode = createElementNode(
        type,
        parentNode.position,
        { width: pw, height: ph },
        resolvedParentId
      );
      setNodes((nds) => [...nds, newNode]);
    },
    [warehouseNode, nodes, setNodes]
  );

  // Add zones with optional form data
  const handleAddZone = useCallback(
    (
      type: ZoneType,
      formData?: {
        name?: string;
        width?: number;
        height?: number;
        length?: number;
        color?: string;
        temperatureMin?: number;
        temperatureMax?: number;
      }
    ) => {
      if (!warehouseNode) return;
      const wStyle = warehouseNode.style || {};
      const pw = (wStyle.width as number) || 800;
      const ph = (wStyle.height as number) || 600;
      const newNode = createZoneNode(type, { width: pw, height: ph }, formData);
      setNodes((nds) => [...nds, newNode]);
    },
    [warehouseNode, setNodes]
  );

  // Add structures
  const handleAddStructure = useCallback(
    (
      type: StructureType,
      formData?: {
        name?: string;
        code?: string;
        width?: number;
        height?: number;
        levelConfigs?: Array<{ name: string; code: string; height: number; partitionCount: number }>;
        color?: string;
        zoneId?: string;
      }
    ) => {
      if (!warehouseNode) return;
      const parentId = formData?.zoneId || "warehouse";
      const parentNode = formData?.zoneId
        ? nodes.find((n) => n.id === formData.zoneId)
        : warehouseNode;
      
      if (!parentNode) return;
      
      const pStyle = parentNode.style || {};
      const pw = (pStyle.width as number) || 800;
      const ph = (pStyle.height as number) || 600;
      const newNode = createStructureNode(
        type,
        { width: pw, height: ph },
        formData,
        parentId
      );
      setNodes((nds) => [...nds, newNode]);
    },
    [warehouseNode, nodes, setNodes]
  );



  // Update any node's data
  const handleUpdateNode = useCallback(
    (id: string, data: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== id) return n;
          const updatedNode = {
            ...n,
            data: { ...n.data, ...data },
          };
          if (data.width || data.height) {
            updatedNode.style = {
              ...n.style,
              ...(data.width ? { width: data.width as number } : {}),
              ...(data.height ? { height: data.height as number } : {}),
            };
          }
          return updatedNode;
        })
      );
    },
    [setNodes]
  );

  // Duplicate node
  const handleDuplicate = useCallback(
    (id: string) => {
      const node = nodes.find((n) => n.id === id);
      if (!node || node.type === "warehouse") return;
      const newNode: Node = {
        ...node,
        id: `${node.type}-${nanoid(6)}`,
        position: {
          x: node.position.x + 20,
          y: node.position.y + 20,
        },
        selected: false,
        data: { ...node.data },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [nodes, setNodes]
  );

  // Delete node (and children if zone)
  const handleDelete = useCallback(
    (id: string) => {
      if (id === "warehouse") return;
      setNodes((nds) => {
        const node = nds.find((n) => n.id === id);
        if (!node) return nds;
        if (node.type === "zone") {
          return nds.filter((n) => n.id !== id && n.parentId !== id);
        }
        return nds.filter((n) => n.id !== id);
      });
      if (selectedNodeId === id) setSelectedNodeId(null);
    },
    [setNodes, selectedNodeId]
  );

  // Rotate element -- only on user rotate action
  // Export as JSON
  const handleExportJSON = useCallback(() => {
    const data = JSON.stringify(nodes, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "warehouse-layout.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes]);

  // Import from JSON
  const handleImportJSON = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          if (Array.isArray(imported)) {
            setNodes(imported);
          }
        } catch {
          // silent fail for invalid JSON
        }
      };
      reader.readAsText(file);
    },
    [setNodes]
  );

  // Handle node click: toolbar actions or select
  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      const target = _event.target as HTMLElement;
      const btn = target.closest("[data-action]") as HTMLElement | null;
      if (btn) {
        const action = btn.dataset.action;
        const nodeId = btn.dataset.nodeId || node.id;
        switch (action) {
          case "edit":
            setSelectedNodeId(nodeId);
            setIsEditingWarehouse(false);
            if (!sidebarOpen) setSidebarOpen(true);
            return;
          case "rotate": {
            const targetNode = nodes.find((n) => n.id === nodeId);
            if (targetNode && targetNode.type === "element") {
              const currentRotation =
                ((targetNode.data as Record<string, unknown>).rotation as number) || 0;
              handleUpdateNode(nodeId, {
                rotation: (currentRotation + 90) % 360,
              });
            }
            return;
          }
          case "duplicate":
            handleDuplicate(nodeId);
            return;
          case "delete":
            handleDelete(nodeId);
            return;
        }
      }
      if (node.type === "warehouse") {
        setIsEditingWarehouse(true);
        setSelectedNodeId(null);
        if (!sidebarOpen) setSidebarOpen(true);
      } else {
        setSelectedNodeId(node.id);
        setIsEditingWarehouse(false);
        if (!sidebarOpen) setSidebarOpen(true);
      }
    },
    [
      nodes,
      handleDuplicate,
      handleDelete,
      handleUpdateNode,
      sidebarOpen,
    ]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setIsEditingWarehouse(false);
  }, []);

  // Snap to grid on drag
  const onNodeDrag: OnNodeDrag = useCallback(() => {
    // Snapping handled by React Flow snapToGrid prop
  }, []);

  // Handle node resize
  const handleNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      onNodesChange(changes);

      for (const change of changes) {
        if (change.type === "dimensions" && change.dimensions) {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === change.id
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      width: change.dimensions!.width,
                      height: change.dimensions!.height,
                    },
                    style: {
                      ...n.style,
                      width: change.dimensions!.width,
                      height: change.dimensions!.height,
                    },
                  }
                : n
            )
          );
        }
      }
    },
    [onNodesChange, setNodes]
  );

  const handleCloseEdit = useCallback(() => {
    if (
      !isEditingWarehouse &&
      selectedNode?.type !== "warehouse"
    ) {
      setIsEditingWarehouse(true);
      setSelectedNodeId(null);
    } else {
      setSelectedNodeId(null);
      setIsEditingWarehouse(false);
    }
  }, [isEditingWarehouse, selectedNode]);

  // Handle partition selection and updates
  useEffect(() => {
    const handlePartitionSelected = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { structureId, levelId, partition } = customEvent.detail;
      setSelectedPartition({ partition, structureId, levelId });
    };

    const handlePartitionUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { structureId, levelId, partition } = customEvent.detail;
      
      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          if (node.id === structureId && node.type === "structure") {
            const data = { ...node.data };
            const levelIndex = data.levels.findIndex((l) => l.id === levelId);
            if (levelIndex !== -1) {
              const updatedLevel = { ...data.levels[levelIndex] };
              const partitionIndex = updatedLevel.partitions.findIndex(
                (p) => p.id === partition.id
              );
              if (partitionIndex !== -1) {
                updatedLevel.partitions[partitionIndex] = partition;
                const updatedLevels = [...data.levels];
                updatedLevels[levelIndex] = updatedLevel;

                // Recalculate structure capacity
                const totalCapacity = updatedLevels.reduce(
                  (sum, level) =>
                    sum +
                    level.partitions.reduce(
                      (partSum, part) => partSum + part.max_capacity,
                      0
                    ),
                  0
                );
                const usedCapacity = updatedLevels.reduce(
                  (sum, level) =>
                    sum +
                    level.partitions.reduce(
                      (partSum, part) => partSum + part.used_capacity,
                      0
                    ),
                  0
                );

                return {
                  ...node,
                  data: {
                    ...data,
                    levels: updatedLevels,
                    max_capacity: totalCapacity,
                    used_capacity: usedCapacity,
                  },
                };
              }
            }
          }
          return node;
        })
      );
    };

    window.addEventListener("partition-selected", handlePartitionSelected);
    window.addEventListener("partition-updated", handlePartitionUpdate);
    return () => {
      window.removeEventListener("partition-selected", handlePartitionSelected);
      window.removeEventListener("partition-updated", handlePartitionUpdate);
    };
  }, [setNodes]);

  return (
    <div className="flex h-screen w-full bg-background">
      <SidePanel
        isOpen={sidebarOpen}
        warehouseExists={warehouseExists}
        warehouseData={warehouseData}
        selectedNode={selectedNode}
        isEditingWarehouse={isEditingWarehouse}
        selectedPartition={selectedPartition}
        onSelectPartition={setSelectedPartition}
        onCreateWarehouse={handleCreateWarehouse}
        onUpdateNode={handleUpdateNode}
        onAddElement={handleAddElement}
        onAddZone={handleAddZone}
        onAddStructure={handleAddStructure}
        onCloseEdit={handleCloseEdit}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
        zones={zones}
      />
      <div className="relative flex-1" ref={reactFlowWrapper}>
        {/* Hamburger toggle */}
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="absolute left-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card shadow-sm transition-colors hover:bg-accent"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? (
            <X size={18} className="text-foreground" />
          ) : (
            <Menu size={18} className="text-foreground" />
          )}
        </button>

        <ReactFlow
          nodes={nodes}
          edges={[]}
          onNodesChange={handleNodesChange}
          onNodeClick={onNodeClick}
          onNodeDrag={onNodeDrag}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          snapToGrid
          snapGrid={[GRID_SIZE, GRID_SIZE]}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={3}
          proOptions={{ hideAttribution: true }}
          className="bg-muted/30"
        >
          <Background gap={GRID_SIZE} size={1} color="hsl(var(--border))" />
          <Controls
            position="bottom-right"
            className="rounded-lg border border-border bg-card shadow-sm"
          />
          <MiniMap
            position="bottom-left"
            nodeStrokeWidth={2}
            maskColor="rgba(0,0,0,0.08)"
            className="rounded-lg border border-border shadow-sm"
            style={{ marginLeft: sidebarOpen ? 0 : 0 }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}
