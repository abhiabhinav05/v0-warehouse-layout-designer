"use client";

import { memo } from "react";
import {
  type NodeProps,
  NodeResizer,
  NodeToolbar,
  Position,
} from "@xyflow/react";
import type { Node } from "@xyflow/react";
import { Copy, Trash2, Pencil, RotateCw } from "lucide-react";
import type { ElementData } from "../types";

type ElementNodeProps = NodeProps<Node<ElementData>> & {
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRotate?: (id: string) => void;
  onEdit?: (id: string) => void;
};

const ELEMENT_ICONS: Record<string, string> = {
  wall: "W",
  gutter: "G",
  walkway: "WK",
  gate: "GT",
};

function ElementNodeComponent({ id, data, selected }: ElementNodeProps) {
  return (
    <>
      <div
        style={{
          transformOrigin: "center",
          transform: `rotate(${data.rotation || 0}deg)`,
          transition: "transform 0.2s ease-out",
          width: "100%",
          height: "100%",
        }}
      >
        <NodeResizer
          isVisible={!!selected}
          minWidth={20}
          minHeight={10}
          lineStyle={{ borderColor: "#2563EB" }}
          handleStyle={{
            width: 6,
            height: 6,
            backgroundColor: "#2563EB",
            borderRadius: 2,
          }}
        />
      </div>
      <NodeToolbar
        isVisible={!!selected}
        position={Position.Top}
        align="center"
        className="flex items-center gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-lg"
      >
        <button
          className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          title="Edit"
          data-action="edit"
          data-node-id={id}
        >
          <Pencil size={13} />
        </button>
        <button
          className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          title="Rotate 90°"
          data-action="rotate"
          data-node-id={id}
        >
          <RotateCw size={13} />
        </button>
        <button
          className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          title="Duplicate"
          data-action="duplicate"
          data-node-id={id}
        >
          <Copy size={13} />
        </button>
        <button
          className="rounded p-1 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
          title="Delete"
          data-action="delete"
          data-node-id={id}
        >
          <Trash2 size={13} />
        </button>
      </NodeToolbar>
      <div
        className="flex h-full w-full items-center justify-center rounded border"
        style={{
          backgroundColor: data.color,
          borderColor: selected ? "#2563EB" : "rgba(0,0,0,0.15)",
          transformOrigin: "center",
          transform: `rotate(${data.rotation || 0}deg)`,
          transition: "transform 0.2s ease-out",
        }}
      >
        <span className="select-none text-[10px] font-medium text-slate-600 pointer-events-none">
          {ELEMENT_ICONS[data.elementType]} - {data.label}
        </span>
      </div>
    </>
  );
}

export const ElementNode = memo(ElementNodeComponent);
