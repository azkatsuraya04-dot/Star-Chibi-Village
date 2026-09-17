export type Direction = 'up' | 'down' | 'left' | 'right';

export type Zone = 
  | 'village' 
  | 'player_house' 
  | 'npc_house_bunny' 
  | 'npc_house_dog' 
  | 'npc_house_bear' 
  | 'shop_interior';

export type ItemType = 'food' | 'seed' | 'decoration';

export interface InventoryItem {
  id: string;
  name: string;
  type: ItemType;
  count: number;
  icon: string;
  price: number;
  description: string;
  energyBonus?: number;
  hygieneBonus?: number;
}

export type PlotStatus = 'empty' | 'growing' | 'ready';

export interface StarPlantPlot {
  id: number;
  stage: 0 | 1 | 2 | 3; // 0: empty, 1: sprout, 2: growing stem, 3: golden star ready
  status?: PlotStatus; // 'empty' | 'growing' | 'ready'
  plantedAt: number | null; // timestamp
  growthDuration: number; // in seconds (30s)
  progress: number; // 0 to 100
}

export function getPlotStatus(plot: StarPlantPlot): PlotStatus {
  if (plot.status) return plot.status;
  if (plot.stage === 3 || plot.progress >= 100) return 'ready';
  if (plot.stage === 0 || !plot.plantedAt) return 'empty';
  return 'growing';
}

export interface PlacedDecoration {
  id: string;
  itemId: string;
  name: string;
  icon: string;
  slot: number; // 0: left, 1: center, 2: right
}

export interface NPC {
  id: string;
  name: string;
  species: 'bunny' | 'dog' | 'bear';
  color: string;
  houseId: Zone;
  villageX: number;
  villageY: number;
  dialogue: string[];
}

export interface PlayerState {
  x: number;
  y: number;
  direction: Direction;
  isMoving: boolean;
  coins: number;
  energy: number;
  hygiene: number;
  zone: Zone;
  animatingAction: 'none' | 'bath' | 'sleep' | 'harvest';
}

export interface GameSaveData {
  coins: number;
  energy: number;
  hygiene: number;
  inventory: InventoryItem[];
  plots: StarPlantPlot[];
  placedDecorations: PlacedDecoration[];
  lastDailyRewardDate: string | null;
  soundEnabled: boolean;
  bgmEnabled?: boolean;
  bgmVolume?: number;
  playerPos: { x: number; y: number; zone: Zone; direction: Direction };
}
