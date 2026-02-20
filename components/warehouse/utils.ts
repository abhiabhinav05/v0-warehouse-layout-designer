import { nanoid } from "nanoid";
import type { Node } from "@xyflow/react";
import {
  ELEMENT_COLORS,
  GRID_SIZE,
  STRUCTURE_COLORS,
  ZONE_COLORS,
  ZONE_LABELS,
  type ElementData,
  type StructureData,
  type StructureType,
  type WarehouseData,
  type WarehouseStatus,
  type ZoneData,
  type ZoneType,
  type Level,
  type Partition,
} from "./types";

export function createWarehouseNode(data: {
  name: string;
  code: string;
  width: number;
  height: number;
  length: number;
  address: string;
  managerName: string;
  managerEmail: string;
  managerPhone: string;
  status: WarehouseStatus;
  maxCapacity: number;
}): Node<WarehouseData> {
  return {
    id: "warehouse",
    type: "warehouse",
    position: { x: 50, y: 50 },
    data: {
      label: data.name,
      code: data.code,
      width: data.width,
      height: data.height,
      length: data.length,
      color: "#F8FAFC",
      address: data.address,
      managerName: data.managerName,
      managerEmail: data.managerEmail,
      managerPhone: data.managerPhone,
      status: data.status,
      maxCapacity: data.maxCapacity,
    },
    draggable: false,
    style: {
      width: data.width,
      height: data.height,
    },
  };
}

export function createElementNode(
  elementType: ElementData["elementType"],
  _parentPosition: { x: number; y: number },
  parentSize: { width: number; height: number },
  parentId: string = "warehouse"
): Node<ElementData> {
  const id = `${elementType}-${nanoid(6)}`;
  const w = elementType === "wall" ? 200 : elementType === "gate" ? 80 : 150;
  const h = elementType === "wall" ? 12 : elementType === "gate" ? 60 : 40;

  return {
    id,
    type: "element",
    position: {
      x: Math.min(
        Math.round((parentSize.width / 2 - w / 2) / GRID_SIZE) * GRID_SIZE,
        parentSize.width - w
      ),
      y: Math.min(
        Math.round((parentSize.height / 2 - h / 2) / GRID_SIZE) * GRID_SIZE,
        parentSize.height - h
      ),
    },
    data: {
      label: elementType.charAt(0).toUpperCase() + elementType.slice(1),
      width: w,
      height: h,
      color: ELEMENT_COLORS[elementType],
      rotation: 0,
      elementType,
    },
    parentId,
    extent: "parent" as const,
    style: { width: w, height: h },
  };
}

export function createZoneNode(
  zoneType: ZoneType,
  parentSize: { width: number; height: number },
  formData?: {
    name?: string;
    width?: number;
    height?: number;
    length?: number;
    color?: string;
    temperatureMin?: number;
    temperatureMax?: number;
  }
): Node<ZoneData> {
  const id = `zone-${nanoid(6)}`;
  const w = formData?.width || 250;
  const h = formData?.height || 200;
  const l = formData?.length || 100;

  return {
    id,
    type: "zone",
    position: {
      x: Math.min(
        Math.round((parentSize.width / 2 - w / 2) / GRID_SIZE) * GRID_SIZE,
        parentSize.width - w
      ),
      y: Math.min(
        Math.round((parentSize.height / 2 - h / 2) / GRID_SIZE) * GRID_SIZE,
        parentSize.height - h
      ),
    },
    data: {
      label: formData?.name || ZONE_LABELS[zoneType],
      width: w,
      height: h,
      length: l,
      color: formData?.color || ZONE_COLORS[zoneType],
      zoneType,
      temperatureMin: formData?.temperatureMin,
      temperatureMax: formData?.temperatureMax,
    },
    parentId: "warehouse",
    extent: "parent" as const,
    style: { width: w, height: h },
  };
}

export function createStructureNode(
  structureType: StructureType,
  parentSize: { width: number; height: number },
  formData?: {
    name?: string;
    code?: string;
    width?: number;
    height?: number;
    levelConfigs?: Array<{ name: string; code: string; height: number; partitionCount: number }>;
    color?: string;
  },
  parentId: string = "warehouse"
): Node<StructureData> {
  const id = `structure-${nanoid(6)}`;
  const w = formData?.width || 200;
  const h = formData?.height || 150;
  const code = formData?.code || `STR-${nanoid(4).toUpperCase()}`;

  // Build default levels if not provided
  const levelConfigs = formData?.levelConfigs || [
    { name: "Level 1", code: "L1", height: 50, partitionCount: 3 },
  ];

  const levels: Level[] = levelConfigs.map((config) => ({
    id: `level-${nanoid(6)}`,
    name: config.name,
    code: config.code,
    height: config.height,
    partitions: Array.from({ length: config.partitionCount }).map((_, idx) => ({
      id: `partition-${nanoid(6)}`,
      name: `P${idx + 1}`,
      code: `P${idx + 1}`,
      width: Math.floor(w / config.partitionCount),
      max_capacity: 100,
      used_capacity: 0,
    })),
  }));

  // Calculate total structure capacity
  const totalCapacity = levels.reduce(
    (sum, level) =>
      sum +
      level.partitions.reduce(
        (partSum, part) => partSum + part.max_capacity,
        0
      ),
    0
  );

  return {
    id,
    type: "structure",
    position: {
      x: Math.min(
        Math.round((parentSize.width / 2 - w / 2) / GRID_SIZE) * GRID_SIZE,
        parentSize.width - w
      ),
      y: Math.min(
        Math.round((parentSize.height / 2 - h / 2) / GRID_SIZE) * GRID_SIZE,
        parentSize.height - h
      ),
    },
    data: {
      label: formData?.name || structureType.charAt(0).toUpperCase() + structureType.slice(1),
      code,
      width: w,
      height: h,
      color: formData?.color || STRUCTURE_COLORS[structureType],
      structureType,
      levels,
      max_capacity: totalCapacity,
      used_capacity: 0,
    },
    parentId,
    extent: "parent" as const,
    style: { width: w, height: h },
  };
}

export function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

export function checkOverlap(
  nodeA: { x: number; y: number; width: number; height: number },
  nodeB: { x: number; y: number; width: number; height: number }
): boolean {
  return !(
    nodeA.x + nodeA.width <= nodeB.x ||
    nodeB.x + nodeB.width <= nodeA.x ||
    nodeA.y + nodeA.height <= nodeB.y ||
    nodeB.y + nodeB.height <= nodeA.y
  );
}
