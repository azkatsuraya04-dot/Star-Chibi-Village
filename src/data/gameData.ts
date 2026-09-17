import { InventoryItem, NPC, StarPlantPlot } from '../types/game';

export const SHOP_ITEMS: InventoryItem[] = [
  // Food
  {
    id: 'food_apple',
    name: 'Sweet Apple',
    type: 'food',
    count: 1,
    icon: '🍎',
    price: 10,
    description: 'Crisp and juicy. Restores +25 Energy.',
    energyBonus: 25,
  },
  {
    id: 'food_cake',
    name: 'Strawberry Cake',
    type: 'food',
    count: 1,
    icon: '🍰',
    price: 25,
    description: 'Fluffy sponge cake! Restores +60 Energy.',
    energyBonus: 60,
  },
  // Seeds
  {
    id: 'seed_star',
    name: 'Star Seed',
    type: 'seed',
    count: 1,
    icon: '⭐',
    price: 20,
    description: 'Magic seed that blossoms into a shining golden star! Harvests for +50 Coin.',
  },
  // Decorations
  {
    id: 'deco_plant',
    name: 'Potted Blossom',
    type: 'decoration',
    count: 1,
    icon: '🌱',
    price: 30,
    description: 'A cozy houseplant that brings fresh warmth to your room.',
  },
  {
    id: 'deco_chair',
    name: 'Wooden Stool',
    type: 'decoration',
    count: 1,
    icon: '🪑',
    price: 40,
    description: 'A comfortable hand-carved village chair.',
  },
  {
    id: 'deco_table',
    name: 'Tea Table',
    type: 'decoration',
    count: 1,
    icon: '🟫',
    price: 50,
    description: 'A cute polished tea table for tea parties.',
  },
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  { ...SHOP_ITEMS[0], count: 2 }, // 2 Apples
  { ...SHOP_ITEMS[2], count: 3 }, // 3 Star Seeds
];

export const INITIAL_PLOTS: StarPlantPlot[] = [
  { id: 0, stage: 0, plantedAt: null, growthDuration: 30, progress: 0 },
  { id: 1, stage: 0, plantedAt: null, growthDuration: 30, progress: 0 },
  { id: 2, stage: 0, plantedAt: null, growthDuration: 30, progress: 0 },
  { id: 3, stage: 0, plantedAt: null, growthDuration: 30, progress: 0 },
];

export const NPCS: NPC[] = [
  {
    id: 'bunny',
    name: 'Bunny Mimi',
    species: 'bunny',
    color: '#ffcdd2',
    houseId: 'npc_house_bunny',
    villageX: 180,
    villageY: 340,
    dialogue: [
      'Hi! Nice to see you, little kitty!',
      'The morning breeze in our village is so refreshing!',
      'Have you checked the Star Garden today? Stars grow so bright at dusk!',
    ],
  },
  {
    id: 'dog',
    name: 'Puppy Bobby',
    species: 'dog',
    color: '#ffe0b2',
    houseId: 'npc_house_dog',
    villageX: 200,
    villageY: 720,
    dialogue: [
      'Woof! Have you planted your Star Plant today?',
      'If you run low on energy, taking a nap in your cozy bed fixes everything!',
      'I love running around Town Square!',
    ],
  },
  {
    id: 'bear',
    name: 'Bear Kuma',
    species: 'bear',
    color: '#d7ccc8',
    houseId: 'npc_house_bear',
    villageX: 680,
    villageY: 720,
    dialogue: [
      'The shop has fresh cakes today! Make sure you try one!',
      'Taking a warm bath keeps your hygiene shiny and sparkling clean!',
      'Harvesting Star Plants gives +50 coins each! Good honest work.',
    ],
  },
];

// World dimensions
export const WORLD_WIDTH = 960;
export const WORLD_HEIGHT = 860;
export const INTERIOR_WIDTH = 640;
export const INTERIOR_HEIGHT = 480;

// Village Structures Layout
export interface Building {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  doorX: number;
  doorY: number;
  roofColor: string;
  wallColor: string;
  targetZone?: 'player_house' | 'npc_house_bunny' | 'npc_house_dog' | 'npc_house_bear' | 'shop_interior';
  icon: string;
}

export const BUILDINGS: Building[] = [
  // Player House (North)
  {
    id: 'player_house',
    name: 'Rumah Pemain',
    x: 400,
    y: 90,
    width: 160,
    height: 120,
    doorX: 480,
    doorY: 210,
    roofColor: '#ef5350',
    wallColor: '#fff9c4',
    targetZone: 'player_house',
    icon: '🏡',
  },
  // Bunny House (West / Left of Square)
  {
    id: 'bunny_house',
    name: 'Rumah Bunny Mimi',
    x: 100,
    y: 280,
    width: 140,
    height: 110,
    doorX: 170,
    doorY: 390,
    roofColor: '#f06292',
    wallColor: '#fce4ec',
    targetZone: 'npc_house_bunny',
    icon: '🐰',
  },
  // Shop (East / Right of Square)
  {
    id: 'shop_building',
    name: 'Toko Desa (Shop)',
    x: 720,
    y: 280,
    width: 160,
    height: 120,
    doorX: 800,
    doorY: 400,
    roofColor: '#42a5f5',
    wallColor: '#e3f2fd',
    targetZone: 'shop_interior',
    icon: '🏪',
  },
  // Dog House (South-West)
  {
    id: 'dog_house',
    name: 'Rumah Puppy Bobby',
    x: 120,
    y: 650,
    width: 140,
    height: 110,
    doorX: 190,
    doorY: 760,
    roofColor: '#ffa726',
    wallColor: '#fff3e0',
    targetZone: 'npc_house_dog',
    icon: '🐶',
  },
  // Bear House (South-East)
  {
    id: 'bear_house',
    name: 'Rumah Bear Kuma',
    x: 700,
    y: 650,
    width: 150,
    height: 110,
    doorX: 775,
    doorY: 760,
    roofColor: '#8d6e63',
    wallColor: '#efebe9',
    targetZone: 'npc_house_bear',
    icon: '🐻',
  },
];

// Garden area coordinates in Village
export const GARDEN_AREA = {
  x: 370,
  y: 490,
  width: 220,
  height: 220,
};

// 4 Garden soil plots inside Garden
export const PLOT_POSITIONS = [
  { id: 0, x: 410, y: 530, width: 60, height: 60 },
  { id: 1, x: 490, y: 530, width: 60, height: 60 },
  { id: 2, x: 410, y: 610, width: 60, height: 60 },
  { id: 3, x: 490, y: 610, width: 60, height: 60 },
];
