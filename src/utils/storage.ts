import { GameSaveData, InventoryItem, PlacedDecoration, StarPlantPlot, Zone } from '../types/game';
import { INITIAL_INVENTORY, INITIAL_PLOTS } from '../data/gameData';

const STORAGE_KEY = 'star_chibi_village_save_v1';

export const DEFAULT_SAVE_DATA: GameSaveData = {
  coins: 100,
  energy: 100,
  hygiene: 100,
  inventory: INITIAL_INVENTORY,
  plots: INITIAL_PLOTS,
  placedDecorations: [
    { id: 'plant_default', itemId: 'deco_plant', name: 'Potted Blossom', icon: '🌱', slot: 1 },
  ],
  lastDailyRewardDate: null,
  soundEnabled: true,
  bgmEnabled: true,
  bgmVolume: 0.4,
  playerPos: {
    x: 480,
    y: 250, // In front of Player's house
    zone: 'village',
    direction: 'down',
  },
};

export function loadGameData(): GameSaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SAVE_DATA;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SAVE_DATA,
      ...parsed,
      inventory: Array.isArray(parsed.inventory) ? parsed.inventory : DEFAULT_SAVE_DATA.inventory,
      plots: Array.isArray(parsed.plots) ? parsed.plots : DEFAULT_SAVE_DATA.plots,
      placedDecorations: Array.isArray(parsed.placedDecorations) ? parsed.placedDecorations : DEFAULT_SAVE_DATA.placedDecorations,
    };
  } catch (e) {
    console.error('Failed to load save data:', e);
    return DEFAULT_SAVE_DATA;
  }
}

export function saveGameData(data: GameSaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save game data:', e);
  }
}

export function canClaimDailyReward(lastClaimDate: string | null): boolean {
  if (!lastClaimDate) return true;
  const today = new Date().toISOString().slice(0, 10);
  return lastClaimDate !== today;
}

export function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function resetGameSave(): GameSaveData {
  localStorage.removeItem(STORAGE_KEY);
  return DEFAULT_SAVE_DATA;
}
