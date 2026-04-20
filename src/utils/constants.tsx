import cursorHand from "../assets/icons/cursor_hand_0.png";
import circle from "../assets/icons/circle.png";
import plane from "../assets/sprites/icon_berlin.png";
import coin from "../assets/sprites/icon_coin.png";
import police from "../assets/sprites/icons8-police-badge-50.png";
import hospital from "../assets/sprites/icons8-hospital-50.png";
import type { StationData } from "../types";

export const RESOURCE_ICONS = {
  coin: coin,
  police: police,
  plane: plane,
  hospital: hospital,
};

export const icons = [
  {
    cursorHand: cursorHand,
    circle: circle,
  },
];

export const WORLD_BASE = [
  { id: "loop_main", asset: "loopA", pos: [0, 0.2, 0.1], rot: [0, Math.PI, 0] },
];

export const WORLD_DECOR = [
  { id: "Pyramid_2_2", asset: "Pyramid_1", pos: [-80, 0, 0], rot: [0, 0, 0] },
  {
    id: "Foundation_7",
    asset: "Foundation_7",
    pos: [-80, 0, 0],
    rot: [0, 0, 0],
    isDefault: true,
  },

  {
    id: "Pyramid_2_2_1",
    asset: "Pyramid_2",
    pos: [-70, 0, 10],
    rot: [0, 0, 0],
  },
  {
    id: "Foundation_8",
    asset: "Foundation_8",
    pos: [-70, 0, 10],
    rot: [0, 0, 0],
    isDefault: true,
  },

  { id: "Pyramid_3_1", asset: "Pyramid_3", pos: [-80, 0, 30], rot: [0, 0, 0] },
  {
    id: "Foundation_9",
    asset: "Foundation_9",
    pos: [-80, 0, 30],
    rot: [0, 0, 0],
    isDefault: true,
  },

  { id: "Pyramid_3_2", asset: "Pyramid_4", pos: [-60, 0, 40], rot: [0, 0, 0] },
  {
    id: "Foundation_10",
    asset: "Foundation_10",
    pos: [-60, 0, 40],
    rot: [0, 0, 0],
    isDefault: true,
  },
];

export const STATIONS_DATA: StationData[] = [
  {
    id: "line_v2_1",
    name: "Станція 1",
    type: "passenger",
    resourceType: "plane",
    distance: 65,
  },
  {
    id: "DLine1_v1",
    name: "Станція 2",
    type: "passenger",
    resourceType: "police",
    distance: 155,
    price: { police: 10, hospital: 5 },
    decorToUnlock: "pyramids",
  },
  {
    id: "line_v2_2",
    name: "Станція 3",
    type: "passenger",
    resourceType: "hospital",
    distance: 210,
  },
  {
    id: "st_upgrade",
    name: "Майстерня Покращень",
    type: "upgrade",
    resourceType: "coin",
    distance: 320,
  },
];

interface StationMapItem {
  id: string;
  asset: string;
  dataIndex?: number;
  pos: [number, number, number];
  rot: [number, number, number];
  spawnOffset?: [number, number, number];
  spawnArea?: { width: number; depth: number };
  isVertical?: boolean;
  isDefault?: boolean;
  shouldStop?: boolean; 
}

export const STATIONS_MAP: StationMapItem[] = [
  {
    id: "line_v2_1",
    asset: "Station_1",
    dataIndex: 0,
    pos: [-1.098553, 0.2, 3],
    rot: [0, -2.8, 0],
    spawnOffset: [-12, 0.5, 33],
    spawnArea: { width: 6, depth: 2 },
    isVertical: false,
    isDefault: true,
    shouldStop: false,
  },
  {
    id: "DLine1_v1",
    asset: "Station_3",
    dataIndex: 1,
    pos: [0, 0.03, 13],
    rot: [0, 0.5, 0],
    spawnOffset: [-47, 0.5, -28],
    spawnArea: { width: 6, depth: 2 },
    isVertical: true,
    isDefault: false,
    shouldStop: false,
  },
  {
    id: "line_v2_2",
    asset: "Station_2",
    dataIndex: 2,
    pos: [-4, 0.2, 76],
    rot: [0, 2.85, 0],
    spawnOffset: [12, 0.5, 33],
    spawnArea: { width: 6, depth: 2 },
    isVertical: false,
    isDefault: true,
    shouldStop: false,
  },
  {
    id: "st_upgrade",
    asset: "Station_upgrade",
    dataIndex: 3,
    pos: [49.5, 0.2, -10],
    rot: [0, -0.85, 0],
    isDefault: true,
    shouldStop: true,
  },
];
