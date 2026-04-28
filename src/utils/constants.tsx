import cursorHand from "../assets/icons/cursor_hand_0.png";
import circle from "../assets/icons/circle.png";
import plane from "../assets/sprites/icon_berlin.png";
import coin from "../assets/sprites/icon_coin.png";
import police from "../assets/sprites/icons8-police-badge-50.png";
import hospital from "../assets/sprites/icons8-hospital-50.png";

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
  { id: "Loop_A", asset: "Loop_A", pos: [0, 0, 0], isDefault: true, noShadow: true },
  { id: "Loop_B", asset: "Loop_B", pos: [0, 0, 0], isDefault: false, noShadow: true, railBuildAnimation: true },
  { id: "Bridge_AB", asset: "Bridge_AB", pos: [0, 0, 0], isDefault: false, noShadow: true, railBuildAnimation: true },
  { id: "Bridge_AB_2", asset: "Bridge_AB_2", pos: [0, 0, 0], isDefault: true, noShadow: true },
  {
    id: "Airport_building",
    asset: "Airport_building",
    pos: [0, 0, 0],
    isDefault: true,
    detach: ["Line1_V1", "House_1_2", "House_2_2", "House_3_3", "House_4_1", "House_5_2"],
    parts: ["Base__2_"],
    animatedParts: ["House_1_2", "House_2_2", "House_3_3", "House_4_1", "House_5_2"],
    animatedPos: [-39.5, 0, -123],
    animatedRot: [0, Math.PI, 0],
  },
  { id: "Lake_1", asset: "Lake_1", pos: [0, 0, 0], isDefault: true },
  { id: "Beach", asset: "Beach", pos: [0, 0, 0], isDefault: true },
  { id: "Bridge", asset: "Bridge", pos: [0, 0, 0], isDefault: true },
  {
    id: "Hospital",
    asset: "Hospital",
    pos: [0, 0, 0],
    isDefault: true,
    parts: [
      "Base__1__4",
    ],
    animatedParts: [
      "Hospital_2",
      "House_1_5",
      "House_2_5",
      "House_3_6",
      "House_4_4",
      "House_5_5",
      "House_12",
      "House_13",
      "House_14",
      "House_15",
    ],
    animatedPos: [-64, 0, -29],
    animatedRot: [0, Math.PI, 0],
  },    

  {
    id: "Observatory",
    asset: "Observatory",
    pos: [0, 0, 0],
    isDefault: true,
    detach: [],
    parts: [
      "Base__1_",
    ],
    animatedParts: [
      "TV_station_1",
      "House_1",
      "House_2",
      "House_3",
      "House_16",
      "House_24",
      "House_28",
      "House_29",
    ],
    animatedPos: [36, 0, -14],
    animatedRot: [0, Math.PI, 0],
  },
  {
    id: "Police_station",
    asset: "Police_station",
    pos: [0, 0, 0],
    isDefault: true,
    parts: [
      "Base__1__1",
    ],
    animatedParts: [
      "Police_station1",
      "House_1_1",
      "House_2_1",
      "House_3_1",
      "House_3_2",
      "House_4",
      "House_5",
      "House_5_1",
      "House_6",
      "House_6_1",
      "House_8",
    ],
    animatedPos: [14, 0, -40],
    animatedRot: [0, Math.PI, 0],
  },
  {
    id: "Stadium",
    asset: "Stadium",
    pos: [0, 0, 0],
    isDefault: true,
    parts: [
      "Base_2",
      "Base__1__2",
    ],
    animatedParts: [
      "House_1_3",
      "House_2_3",
      "House_3_4",
      "House_4_2",
      "House_5_3",
      "House_19",
      "House_23",
      "House_26",
    ],
    animatedPos: [128, 0, -50],
    animatedRot: [-Math.PI/2, Math.PI, -Math.PI/2],
  },

  // Roads
  {
    id: "Section_of_road__18_",
    asset: "Section_of_road__18_",
    pos: [0, 0, 0],
    isDefault: true,
  },
  {
    id: "Section_of_road__16_",
    asset: "Section_of_road__16_",
    pos: [0, 0, 0],
    isDefault: true,
  },
  {
    id: "Section_of_road__15_",
    asset: "Section_of_road__15_",
    pos: [0, 0, 0],
    isDefault: true,
  },
  {
    id: "Section_of_road__14_",
    asset: "Section_of_road__14_",
    pos: [0, 0, 0],
    isDefault: true,
  },
  {
    id: "Section_of_road__12_",
    asset: "Section_of_road__12_",
    pos: [0, 0, 0],
    isDefault: true,
  },
  {
    id: "Section_of_road__26_",
    asset: "Section_of_road__26_",
    pos: [0, 0, 0],
    isDefault: true,
  },
  { id: "Crosswalk", asset: "Crosswalk", pos: [0, 0, 0], isDefault: true },
  {
    id: "Section_of_road__25_",
    asset: "Section_of_road__25_",
    pos: [0, 0, 0],
    isDefault: true,
  },
  {
    id: "Section_of_road__21_",
    asset: "Section_of_road__21_",
    pos: [0, 0, 0],
    isDefault: true,
  },
  { id: "Turn_1", asset: "Turn_1", pos: [0, 0, 0], isDefault: true },
  {
    id: "Section_half_of_road__2_",
    asset: "Section_half_of_road__2_",
    pos: [0, 0, 0],
    isDefault: true,
  },
  { id: "Turn__1__1", asset: "Turn__1__1", pos: [0, 0, 0], isDefault: true },
  {
    id: "Section_of_road__20_",
    asset: "Section_of_road__20_",
    pos: [0, 0, 0],
    isDefault: true,
  },
  {
    id: "Section_of_road__19_",
    asset: "Section_of_road__19_",
    pos: [0, 0, 0],
    isDefault: true,
  },
  {
    id: "Section_of_road__27_",
    asset: "Section_of_road__27_",
    pos: [0, 0, 0],
    isDefault: true,
  },
  {
    id: "Section_of_road__23_",
    asset: "Section_of_road__23_",
    pos: [0, 0, 0],
    isDefault: true,
  },

  {
    id: "Section_of_road__33_",
    asset: "Section_of_road__33_",
    pos: [0, 0, 0],
    isDefault: true,
  },
] as const;

export const WORLD_DECOR = [
  {
    id: "Pizza",
    asset: "Pizza",
    pos: [0, 0, 0],
    isDefault: false,
    detach: ["Line2_V1", "House_1_4", "House_2_4", "House_3_5", "House_4_3", "House_5_4", "House_6_2", "House_7", "House_10", "House_20", "House_22", "Pizza_1.001"],
    parts: [
      "Base__1__3",
    ],
    animatedParts: [
      "House_1_4",
      "House_2_4",
      "House_3_5",
      "House_4_3",
      "House_5_4",
      "House_6_2",
      "House_7",
      "House_10",
      "House_20",
      "House_22",
      "Pizza_1.001",
    ],
    animatedPos: [50.5, 0, -115],
    animatedRot: [0, Math.PI, 0],
  },
];

interface StationConfigItem {
  id: string;
  name: string;
  type: string;
  resourceType?: string;
  distance: number;
  price?: { police: number; hospital: number };
  decorToUnlock?: string;
  pos: [number, number, number];
  rot: [number, number, number];
  parts: string[];
  spawnOffset?: [number, number, number];
  spawnArea?: { width: number; depth: number };
  unboardOffset?: [number, number, number];
  isDefault?: boolean;
  shouldStop?: boolean;
  isVertical?: boolean;
  spline?: number;
}

export const STATIONS_CONFIG: StationConfigItem[] = [
  // Station 1 - Airport type (plane)
  {
    id: "Station_1",
    name: "Станція 1",
    type: "passenger",
    resourceType: "plane",
    distance: 306,
    pos: [-40, 2, -105],
    rot: [0, Math.PI, 0],
    parts: ["Line1_V1"],
    spawnOffset: [0, 0, 0],
    spawnArea: { width: 6, depth: 2 },
    unboardOffset: [0, 0, 0],
    isDefault: true,
    shouldStop: false,
    spline: 0,
  },
  // Station 2 - Police type
  {
    id: "Station_2",
    name: "Станція 2",
    type: "passenger",
    resourceType: "police",
    distance: 215,
    price: { police: 10, hospital: 5 },
    pos: [4, 2, -40],
    rot: [0, Math.PI / 2, 0],
    parts: ["Line2_V1"],
    spawnArea: { width: 8, depth: 2 },
    unboardOffset: [0, 0, 0],
    isDefault: true,
    shouldStop: false,
    spline: 0,
  },
  // Station 3 - Hospital type
  {
    id: "Station_3",
    name: "Станція 3",
    type: "passenger",
    resourceType: "hospital",
    distance: 80,
    pos: [-75.5, 2, -30],
    rot: [0, Math.PI / 2, 0],
    parts: ["Line1_V1"],
    spawnArea: { width: 6.5, depth: 2 },
    unboardOffset: [0, 0, 0],
    isDefault: true,
    shouldStop: false,
    spline: 0,
  },
  // Station 4 - Pizza type
  {
    id: "Station_4",
    name: "Станція 4",
    type: "passenger",
    resourceType: "pizza",
    distance: 240,
    pos: [38, 2, -105],
    rot: [0, -Math.PI, 0],
    parts: ["Line1_V1"],
    isDefault: false,
    decorToUnlock: "Pizza",
    unboardOffset: [0, 0, 0],
    shouldStop: false,
    spline: 1,
  },
  // Station 5 - Observatory type
  {
    id: "Station_5",
    name: "Станція 5",
    type: "passenger",
    resourceType: "observatory",
    distance: 47,
    pos: [35, 2, -5],
    rot: [0, Math.PI, 0],
    parts: ["Line2_V1"],
    // spawnOffset: [2, 0.5, 0],
    spawnArea: { width: 6.5, depth: 2 },
    unboardOffset: [0, 0, 0],
    isDefault: true,
    shouldStop: false,
    spline: 1,
  },
  // Station 6 - Stadium type
  {
    id: "Station_6",
    name: "Станція 6",
    type: "passenger",
    resourceType: "stadium",
    distance: 150,
    pos: [105, 2, -48],
    rot: [0, Math.PI / 2, 0],
    parts: ["Line2_V1"],
    // spawnOffset: [0, 0.5, 0],
    spawnArea: { width: 6.5, depth: 2 },
    unboardOffset: [0, 0, 0],
    isDefault: true,
    shouldStop: false,
    spline: 1,
  },
];
