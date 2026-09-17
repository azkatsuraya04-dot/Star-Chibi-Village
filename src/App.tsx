import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Direction, GameSaveData, InventoryItem, NPC, StarPlantPlot, Zone, getPlotStatus } from './types/game';
import { BUILDINGS, NPCS, PLOT_POSITIONS, SHOP_ITEMS } from './data/gameData';
import {
  canClaimDailyReward,
  DEFAULT_SAVE_DATA,
  getTodayDateString,
  loadGameData,
  resetGameSave,
  saveGameData,
} from './utils/storage';
import { soundManager } from './utils/audio';
import { bgmEngine } from './utils/bgm';
import { VillageCanvas } from './components/VillageCanvas';
import { HUD } from './components/HUD';
import { ActionInfo, ActionPrompt } from './components/ActionPrompt';
import { VirtualControls } from './components/VirtualControls';
import { ShopModal } from './components/ShopModal';
import { InventoryModal } from './components/InventoryModal';
import { MapModal } from './components/MapModal';
import { SettingsModal } from './components/SettingsModal';
import { DailyRewardModal } from './components/DailyRewardModal';
import { DialogueBox } from './components/DialogueBox';

export default function App() {
  // Main Game State
  const [gameState, setGameState] = useState<GameSaveData>(() => loadGameData());
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // Input vector for movement
  const [keyboardVector, setKeyboardVector] = useState({ x: 0, y: 0 });
  const [virtualVector, setVirtualVector] = useState({ x: 0, y: 0 });

  // Current temporary action animation
  const [activeAction, setActiveAction] = useState<'none' | 'bath' | 'sleep' | 'harvest'>('none');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDailyRewardOpen, setIsDailyRewardOpen] = useState(false);
  const [talkingNPC, setTalkingNPC] = useState<NPC | null>(null);

  // Save changes to localStorage
  useEffect(() => {
    saveGameData(gameState);
  }, [gameState]);

  // Sync sound manager enabled state
  useEffect(() => {
    soundManager.setEnabled(gameState.soundEnabled);
  }, [gameState.soundEnabled]);

  // Sync BGM engine enabled state and volume
  useEffect(() => {
    const isBgmActive = gameState.bgmEnabled ?? true;
    bgmEngine.setEnabled(isBgmActive);
    bgmEngine.setVolume(gameState.bgmVolume ?? 0.4);
  }, [gameState.bgmEnabled, gameState.bgmVolume]);

  // Start BGM on first user interaction (keyboard, mouse, or touch) to respect browser autoplay policy
  useEffect(() => {
    const handleFirstGesture = () => {
      if (gameState.bgmEnabled ?? true) {
        bgmEngine.start();
      }
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };

    window.addEventListener('pointerdown', handleFirstGesture);
    window.addEventListener('keydown', handleFirstGesture);
    window.addEventListener('touchstart', handleFirstGesture);

    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };
  }, [gameState.bgmEnabled]);

  // Check Daily Reward on Mount
  useEffect(() => {
    if (canClaimDailyReward(gameState.lastDailyRewardDate)) {
      const timer = setTimeout(() => {
        setIsDailyRewardOpen(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [gameState.lastDailyRewardDate]);

  // Show quick toast banner
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Combined movement vector (keyboard or mobile D-pad)
  const movementVector = useMemo(() => {
    if (keyboardVector.x !== 0 || keyboardVector.y !== 0) {
      return keyboardVector;
    }
    return virtualVector;
  }, [keyboardVector, virtualVector]);

  // Star Plant Growth timer loop (Prototype: 30 seconds to fully grow)
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState((prev) => {
        let hasChanges = false;
        const now = Date.now();

        const updatedPlots = prev.plots.map((plot) => {
          const currentStatus = getPlotStatus(plot);
          if (currentStatus === 'empty' || currentStatus === 'ready' || !plot.plantedAt) {
            return plot;
          }

          const elapsedSec = (now - plot.plantedAt) / 1000;
          const duration = plot.growthDuration || 30;
          const progress = Math.min(100, Math.round((elapsedSec / duration) * 100));

          let stage: 1 | 2 | 3 = 1;
          let newStatus: 'growing' | 'ready' = 'growing';
          if (progress >= 100) {
            stage = 3;
            newStatus = 'ready';
          } else if (progress >= 45) {
            stage = 2;
          }

          if (stage !== plot.stage || progress !== plot.progress || newStatus !== plot.status) {
            hasChanges = true;
            return {
              ...plot,
              stage,
              status: newStatus,
              progress,
            };
          }

          return plot;
        });

        if (hasChanges) {
          return { ...prev, plots: updatedPlots };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Proximity Calculation to Determine Available Action
  const availableAction: ActionInfo | null = useMemo(() => {
    if (activeAction !== 'none') return null;

    const { x, y, zone } = gameState.playerPos;

    if (zone === 'village') {
      // Check building entrance doors
      for (const b of BUILDINGS) {
        const dist = Math.hypot(x - b.doorX, y - (b.doorY + 8));
        if (dist < 42) {
          return {
            type: 'door',
            title: `Masuk ke ${b.name}`,
            subtitle: 'Tekan untuk masuk',
            icon: b.icon,
            targetId: b.targetZone,
          };
        }
      }

      // Check village NPCs
      for (const npc of NPCS) {
        const dist = Math.hypot(x - npc.villageX, y - npc.villageY);
        if (dist < 48) {
          const emoji = npc.species === 'bunny' ? '🐰' : npc.species === 'dog' ? '🐶' : '🐻';
          return {
            type: 'npc',
            title: `Bicara dengan ${npc.name}`,
            subtitle: 'Mengobrol santai',
            icon: emoji,
            targetId: npc.id,
          };
        }
      }

      // Check Star Garden Plots with distinct status prompts
      for (const plotPos of PLOT_POSITIONS) {
        const centerX = plotPos.x + plotPos.width / 2;
        const centerY = plotPos.y + plotPos.height / 2;
        const dist = Math.hypot(x - centerX, y - centerY);
        if (dist < 52) {
          const plotData = gameState.plots.find((p) => p.id === plotPos.id);
          const status = plotData ? getPlotStatus(plotData) : 'empty';

          if (status === 'empty') {
            return {
              type: 'plot',
              promptText: 'Press E to Plant',
              title: 'Tanam Bibit Star Seed',
              subtitle: 'Gunakan 1x Star Seed dari tas',
              icon: '🌱',
              targetId: plotPos.id,
            };
          } else if (status === 'ready') {
            return {
              type: 'plot',
              promptText: 'Press E to Harvest',
              title: 'PANEN STAR PLANT!',
              subtitle: 'Hadiah: +50 Coin Emas ⭐',
              icon: '⭐',
              targetId: plotPos.id,
              highlight: true,
            };
          } else {
            // Status: growing
            const elapsed = plotData?.plantedAt ? (Date.now() - plotData.plantedAt) / 1000 : 0;
            const remainingSec = Math.max(0, Math.ceil((plotData?.growthDuration || 30) - elapsed));
            return {
              type: 'plot',
              promptText: remainingSec > 0 ? `Growing... ${remainingSec}s` : 'Growing...',
              title: `Star Plant Sedang Tumbuh (${plotData?.progress ?? 0}%)`,
              subtitle: `Tersisa ${remainingSec}s sampai panen ⭐`,
              icon: '🌱',
              targetId: plotPos.id,
            };
          }
        }
      }
    } else if (zone === 'player_house') {
      // Exit Door
      if (y > 390 && Math.abs(x - 320) < 50) {
        return {
          type: 'door',
          title: 'Keluar ke Desa',
          subtitle: 'Kembali ke halaman desa',
          icon: '🚪',
          targetId: 'village',
        };
      }

      // Bathtub (top-left: x: 135, y: 150)
      const bathDist = Math.hypot(x - 135, y - 150);
      if (bathDist < 58) {
        return {
          type: 'bath',
          title: 'Mandi (Take a Bath)',
          subtitle: '+30 Hygiene, -5 Energy',
          icon: '🛁',
        };
      }

      // Bed (top-right: x: 495, y: 155)
      const bedDist = Math.hypot(x - 495, y - 155);
      if (bedDist < 58) {
        return {
          type: 'bed',
          title: 'Tidur di Kasur',
          subtitle: 'Memulihkan Energy hingga 100',
          icon: '🛏️',
        };
      }
    } else if (zone === 'shop_interior') {
      // Exit Door
      if (y > 390 && Math.abs(x - 320) < 50) {
        return {
          type: 'door',
          title: 'Keluar ke Desa',
          subtitle: 'Kembali ke halaman desa',
          icon: '🚪',
          targetId: 'village',
        };
      }

      // Shopkeeper Counter
      const shopDist = Math.hypot(x - 320, y - 180);
      if (shopDist < 60) {
        return {
          type: 'shop',
          title: 'Belanja di Toko',
          subtitle: 'Beli makanan, bibit, dan dekorasi',
          icon: '🏪',
        };
      }
    } else {
      // NPC Houses (bunny, dog, bear)
      // Exit Door
      if (y > 390 && Math.abs(x - 320) < 50) {
        return {
          type: 'door',
          title: 'Keluar ke Desa',
          subtitle: 'Kembali ke halaman desa',
          icon: '🚪',
          targetId: 'village',
        };
      }

      // NPC in room
      const npcDist = Math.hypot(x - 320, y - 240);
      if (npcDist < 64) {
        const npc = NPCS.find((n) => n.houseId === zone);
        if (npc) {
          const emoji = npc.species === 'bunny' ? '🐰' : npc.species === 'dog' ? '🐶' : '🐻';
          return {
            type: 'npc',
            title: `Bicara dengan ${npc.name}`,
            subtitle: 'Menyapa teman',
            icon: emoji,
            targetId: npc.id,
          };
        }
      }
    }

    return null;
  }, [gameState.playerPos, gameState.plots, activeAction]);

  // Change zone / enter house
  const handleEnterZone = (targetZone: Zone) => {
    if (targetZone === 'village') {
      // Exiting an interior back to front of that building in village
      const current = gameState.playerPos.zone;
      let returnX = 480;
      let returnY = 240;

      if (current === 'npc_house_bunny') {
        returnX = 170;
        returnY = 410;
      } else if (current === 'shop_interior') {
        returnX = 800;
        returnY = 420;
      } else if (current === 'npc_house_dog') {
        returnX = 190;
        returnY = 780;
      } else if (current === 'npc_house_bear') {
        returnX = 775;
        returnY = 780;
      }

      setGameState((prev) => ({
        ...prev,
        playerPos: {
          x: returnX,
          y: returnY,
          zone: 'village',
          direction: 'down',
        },
      }));
      showToast('Kembali ke Desa Bintang 🌸');
    } else {
      // Entering building interior (spawn near door bottom: 320, 380)
      setGameState((prev) => ({
        ...prev,
        playerPos: {
          x: 320,
          y: 370,
          zone: targetZone,
          direction: 'up',
        },
      }));

      const b = BUILDINGS.find((b) => b.targetZone === targetZone);
      showToast(`Masuk ke ${b ? b.name : 'Rumah'}`);
    }
  };

  // Take a Bath Action
  const handleTakeBath = () => {
    if (activeAction !== 'none') return;
    setActiveAction('bath');
    soundManager.playBath();

    // Teleport next to tub
    setGameState((prev) => ({
      ...prev,
      playerPos: { ...prev.playerPos, x: 135, y: 155, direction: 'down' },
    }));

    showToast('🛁 Mandi dengan busa wangi... (+30 Hygiene, -5 Energy)');

    setTimeout(() => {
      setGameState((prev) => ({
        ...prev,
        hygiene: Math.min(100, prev.hygiene + 30),
        energy: Math.max(0, prev.energy - 5),
      }));
      setActiveAction('none');
      soundManager.playPop();
      showToast('✨ Badanmu sekarang bersih dan segar!');
    }, 2400);
  };

  // Sleep in Bed Action
  const handleSleepInBed = () => {
    if (activeAction !== 'none') return;
    setActiveAction('sleep');
    soundManager.playSleep();

    // Teleport onto bed
    setGameState((prev) => ({
      ...prev,
      playerPos: { ...prev.playerPos, x: 495, y: 155, direction: 'down' },
    }));

    showToast('🛏️ Tidur lelap di kasur hangat... z Z Z');

    setTimeout(() => {
      setGameState((prev) => ({
        ...prev,
        energy: 100,
      }));
      setActiveAction('none');
      soundManager.playPop();
      showToast('☀️ Bangun tidur! Energimu penuh kembali (100)!');
    }, 2500);
  };

  // ================= STAR GARDEN INTERACTION SYSTEM =================
  // 1. PLOT KOSONG: Tanam bibit Star Seed
  const plantSeed = useCallback((plotId: number) => {
    const current = gameStateRef.current;
    const seedItem = current.inventory.find((i) => i.id === 'seed_star' && i.count > 0);
    if (!seedItem) {
      showToast('Kamu tidak punya Star Seed! Beli di Toko Desa seharga 20 Coin.');
      return;
    }

    soundManager.playPop();

    setGameState((prev) => {
      // Gunakan 1 Star Seed dari inventory HANYA ketika menanam
      const updatedInv = prev.inventory
        .map((i) => (i.id === 'seed_star' ? { ...i, count: i.count - 1 } : i))
        .filter((i) => i.count > 0);

      // Ubah status plot menjadi "growing" dan mulai timer pertumbuhan
      const updatedPlots = prev.plots.map((p) =>
        p.id === plotId
          ? {
              ...p,
              stage: 1 as const,
              status: 'growing' as const,
              plantedAt: Date.now(),
              progress: 0,
              growthDuration: 30,
            }
          : p
      );

      return {
        ...prev,
        inventory: updatedInv,
        plots: updatedPlots,
      };
    });

    showToast('🌱 Bibit Star Seed berhasil ditanam! Tunggu 30 detik.');
  }, []);

  // 2. TANAMAN SEDANG TUMBUH: Tampilkan sisa waktu, tidak menanam baru, tidak memberi reward
  const showGrowingMessage = useCallback((plotId: number) => {
    const current = gameStateRef.current;
    const plot = current.plots.find((p) => p.id === plotId);
    if (!plot) return;

    soundManager.playPop();
    const elapsed = plot.plantedAt ? (Date.now() - plot.plantedAt) / 1000 : 0;
    const remainingSec = Math.max(0, Math.ceil((plot.growthDuration || 30) - elapsed));
    showToast(`🌱 Tanaman sedang tumbuh (${remainingSec}s tersisa, ${plot.progress}%)... Sabar ya!`);
  }, []);

  // 3. TANAMAN SUDAH MATANG: Panen tanaman, berikan reward +50 Coin, reset plot menjadi empty
  const harvestPlant = useCallback((plotId: number) => {
    soundManager.playHarvest();
    setActiveAction('harvest');
    setTimeout(() => setActiveAction('none'), 800);

    setGameState((prev) => {
      // Reset plot menjadi "empty", hapus status tanaman dari plot
      const nextPlots = prev.plots.map((p) =>
        p.id === plotId
          ? {
              ...p,
              stage: 0 as const,
              status: 'empty' as const,
              plantedAt: null,
              progress: 0,
            }
          : p
      );

      // Berikan reward Coin (+50) ke pemain, inventory benih TIDAK dikurangi
      return {
        ...prev,
        coins: prev.coins + 50,
        plots: nextPlots,
      };
    });

    showToast('⭐ PANEN SUKSES! +50 Coin Emas berhasil didapatkan!');
  }, []);

  // Logika interaksi setiap plot kebun dibedakan berdasarkan STATUS tanaman
  const handleInteractPlot = useCallback(
    (plotId: number) => {
      const currentPlots = gameStateRef.current.plots;
      const plot = currentPlots.find((p) => p.id === plotId);
      if (!plot) return;

      const status = getPlotStatus(plot);

      if (status === 'empty') {
        plantSeed(plotId);
      } else if (status === 'growing') {
        showGrowingMessage(plotId);
      } else if (status === 'ready') {
        harvestPlant(plotId);
      }
    },
    [plantSeed, showGrowingMessage, harvestPlant]
  );

  // Action proximity ref to avoid stale closures in event listeners
  const availableActionRef = useRef<ActionInfo | null>(null);
  availableActionRef.current = availableAction;

  const isModalOpenRef = useRef(false);
  isModalOpenRef.current =
    isShopOpen ||
    isInventoryOpen ||
    isMapOpen ||
    isSettingsOpen ||
    isDailyRewardOpen ||
    Boolean(talkingNPC);

  // 1. Enter/Exit House: Exclusively triggered by ENTER key when near a door
  const handleExecuteDoorAction = useCallback(() => {
    const action = availableActionRef.current;
    if (!action || action.type !== 'door') return;

    soundManager.playPop();
    const targetZone = (action.targetId as Zone) || 'village';
    handleEnterZone(targetZone);
  }, []);

  // 2. Interact with Object or NPC: Exclusively triggered by E key
  const handleExecuteInteractAction = useCallback(() => {
    const action = availableActionRef.current;
    if (!action || action.type === 'door') return;

    soundManager.playPop();

    if (action.type === 'npc') {
      const npc = NPCS.find((n) => n.id === action.targetId);
      if (npc) {
        setTalkingNPC(npc);
      }
    } else if (action.type === 'bath') {
      handleTakeBath();
    } else if (action.type === 'bed') {
      handleSleepInBed();
    } else if (action.type === 'shop') {
      setIsShopOpen(true);
    } else if (action.type === 'plot') {
      const plotId = action.targetId as number;
      handleInteractPlot(plotId);
    }
  }, [handleInteractPlot]);

  // 3. General executor for mobile touch button or prompt click
  const handleExecuteAvailableAction = useCallback(() => {
    const action = availableActionRef.current;
    if (!action) return;

    if (action.type === 'door') {
      handleExecuteDoorAction();
    } else {
      handleExecuteInteractAction();
    }
  }, [handleExecuteDoorAction, handleExecuteInteractAction]);

  // Stop moving when modal or dialogue opens
  useEffect(() => {
    if (isModalOpenRef.current) {
      setKeyboardVector({ x: 0, y: 0 });
    }
  }, [isShopOpen, isInventoryOpen, isMapOpen, isSettingsOpen, isDailyRewardOpen, talkingNPC]);

  // Keyboard controls listener
  // Rules:
  // - WASD / Arrow Keys = move character
  // - E = interact with object or NPC
  // - ENTER = enter/exit house when near door
  // - SPACE = NEVER enters house, never executes door action
  useEffect(() => {
    const keysPressed: { [key: string]: boolean } = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      // Ignore game controls when modal or dialogue is active
      if (isModalOpenRef.current) return;

      const keyLower = e.key.toLowerCase();
      keysPressed[keyLower] = true;

      // 1. WASD / Arrow Keys = Movement
      if (
        ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(keyLower)
      ) {
        updateKeyboardVector();
      }

      // 2. ENTER = Enter/Exit house when near door
      if (e.key === 'Enter' || e.code === 'Enter' || e.code === 'NumpadEnter') {
        const action = availableActionRef.current;
        if (action && action.type === 'door') {
          e.preventDefault();
          handleExecuteDoorAction();
          return;
        }
      }

      // 3. E = Interact with NPC or Object
      if (keyLower === 'e' || e.code === 'KeyE') {
        const action = availableActionRef.current;
        if (action && action.type !== 'door') {
          e.preventDefault();
          handleExecuteInteractAction();
          return;
        }
      }

      // 4. SPACE = DO NOT use to enter house and do NOT trigger enter house
      if (e.code === 'Space') {
        e.preventDefault();
        // Space is strictly prevented from executing door actions
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keyLower = e.key.toLowerCase();
      keysPressed[keyLower] = false;
      updateKeyboardVector();
    };

    const updateKeyboardVector = () => {
      let vx = 0;
      let vy = 0;
      if (keysPressed['a'] || keysPressed['arrowleft']) vx -= 1;
      if (keysPressed['d'] || keysPressed['arrowright']) vx += 1;
      if (keysPressed['w'] || keysPressed['arrowup']) vy -= 1;
      if (keysPressed['s'] || keysPressed['arrowdown']) vy += 1;
      setKeyboardVector({ x: vx, y: vy });
    };

    const handleBlur = () => {
      for (const k in keysPressed) {
        keysPressed[k] = false;
      }
      setKeyboardVector({ x: 0, y: 0 });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [handleExecuteDoorAction, handleExecuteInteractAction]);

  // Buy item from shop
  const handleBuyItem = (item: InventoryItem) => {
    if (gameState.coins < item.price) return;

    setGameState((prev) => {
      const existing = prev.inventory.find((i) => i.id === item.id);
      let nextInventory: InventoryItem[];

      if (existing) {
        nextInventory = prev.inventory.map((i) =>
          i.id === item.id ? { ...i, count: i.count + 1 } : i
        );
      } else {
        nextInventory = [...prev.inventory, { ...item, count: 1 }];
      }

      return {
        ...prev,
        coins: prev.coins - item.price,
        inventory: nextInventory,
      };
    });

    showToast(`Berhasil membeli ${item.name}! Masuk ke dalam tas.`);
  };

  // Use food from inventory
  const handleUseFood = (item: InventoryItem) => {
    soundManager.playPop();

    setGameState((prev) => {
      const updatedInv = prev.inventory
        .map((i) => (i.id === item.id ? { ...i, count: i.count - 1 } : i))
        .filter((i) => i.count > 0);

      const bonus = item.energyBonus || 25;
      return {
        ...prev,
        energy: Math.min(100, prev.energy + bonus),
        inventory: updatedInv,
      };
    });
  };

  // Place decoration in player's house
  const handlePlaceDecoration = (item: InventoryItem) => {
    soundManager.playPop();

    setGameState((prev) => {
      // Check if already placed in decor slots
      const newPlaced = [
        ...prev.placedDecorations.filter((d) => d.itemId !== item.id),
        {
          id: `placed_${Date.now()}`,
          itemId: item.id,
          name: item.name,
          icon: item.icon,
          slot: (prev.placedDecorations.length % 3),
        },
      ];

      return {
        ...prev,
        placedDecorations: newPlaced,
      };
    });
  };

  // Claim Daily Reward
  const handleClaimDailyReward = () => {
    setGameState((prev) => ({
      ...prev,
      coins: prev.coins + 20,
      lastDailyRewardDate: getTodayDateString(),
    }));
    setIsDailyRewardOpen(false);
    showToast('🎁 Hadiah harian berhasil diklaim! +20 Coin.');
  };

  // Reset progress
  const handleResetProgress = () => {
    const fresh = resetGameSave();
    setGameState(fresh);
    showToast('Game direset ke awal!');
  };

  // Update position from VillageCanvas
  const handleUpdatePlayerPos = useCallback(
    (x: number, y: number, zone: Zone, direction: Direction) => {
      setGameState((prev) => ({
        ...prev,
        playerPos: { x, y, zone, direction },
      }));
    },
    []
  );

  const handleToggleBgm = useCallback(() => {
    setGameState((prev) => {
      const current = prev.bgmEnabled ?? true;
      const next = !current;
      bgmEngine.setEnabled(next);
      if (next) {
        bgmEngine.start();
      }
      return { ...prev, bgmEnabled: next };
    });
  }, []);

  const handleChangeBgmVolume = useCallback((volume: number) => {
    bgmEngine.setVolume(volume);
    setGameState((prev) => ({ ...prev, bgmVolume: volume }));
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#9edb74] font-sans select-none">
      {/* 2D Canvas Viewport */}
      <VillageCanvas
        gameState={gameState}
        onUpdatePlayerPos={handleUpdatePlayerPos}
        onInteract={() => handleExecuteAvailableAction()}
        onInteractPlot={handleInteractPlot}
        activeAction={activeAction}
        movementVector={movementVector}
      />

      {/* Floating HUD */}
      <HUD
        gameState={gameState}
        onOpenInventory={() => setIsInventoryOpen(true)}
        onOpenShop={() => setIsShopOpen(true)}
        onOpenMap={() => setIsMapOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleBgm={handleToggleBgm}
        onLeaveInterior={
          gameState.playerPos.zone !== 'village' ? () => handleEnterZone('village') : undefined
        }
      />

      {/* Floating Action Prompt when near interactive objects */}
      <ActionPrompt
        action={availableAction}
        onExecute={handleExecuteAvailableAction}
      />

      {/* Virtual D-Pad & Action Button for Mobile/Touch */}
      <VirtualControls
        onDirectionChange={setVirtualVector}
        onActionClick={handleExecuteAvailableAction}
        hasAvailableAction={Boolean(availableAction)}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 bg-[#3e2723]/95 text-white px-5 py-2.5 rounded-full shadow-xl border-2 border-amber-300 text-xs sm:text-sm font-extrabold tracking-wide flex items-center gap-2 pointer-events-none transition-all duration-300">
          <span>🔔</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MODALS */}
      {/* 1. Shop Modal */}
      <ShopModal
        coins={gameState.coins}
        inventory={gameState.inventory}
        isOpen={isShopOpen}
        onClose={() => setIsShopOpen(false)}
        onBuyItem={handleBuyItem}
      />

      {/* 2. Inventory Modal */}
      <InventoryModal
        inventory={gameState.inventory}
        currentZone={gameState.playerPos.zone}
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
        onUseFood={handleUseFood}
        onPlaceDecoration={handlePlaceDecoration}
      />

      {/* 3. Map Modal */}
      <MapModal
        currentZone={gameState.playerPos.zone}
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
      />

      {/* 4. Settings Modal */}
      <SettingsModal
        soundEnabled={gameState.soundEnabled}
        bgmEnabled={gameState.bgmEnabled ?? true}
        bgmVolume={gameState.bgmVolume ?? 0.4}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onToggleSound={() =>
          setGameState((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))
        }
        onToggleBgm={handleToggleBgm}
        onChangeBgmVolume={handleChangeBgmVolume}
        onResetGame={handleResetProgress}
      />

      {/* 5. Daily Reward Modal */}
      <DailyRewardModal
        isOpen={isDailyRewardOpen}
        onClaim={handleClaimDailyReward}
      />

      {/* 6. NPC Dialogue Box */}
      <DialogueBox
        npc={talkingNPC}
        isOpen={Boolean(talkingNPC)}
        onClose={() => setTalkingNPC(null)}
      />
    </main>
  );
}
