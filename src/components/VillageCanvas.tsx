import React, { useEffect, useRef, useCallback } from 'react';
import { Direction, GameSaveData, NPC, StarPlantPlot, Zone } from '../types/game';
import { BUILDINGS, GARDEN_AREA, NPCS, PLOT_POSITIONS, WORLD_HEIGHT, WORLD_WIDTH } from '../data/gameData';
import { soundManager } from '../utils/audio';

interface VillageCanvasProps {
  gameState: GameSaveData;
  onUpdatePlayerPos: (x: number, y: number, zone: Zone, direction: Direction) => void;
  onInteract: (type: 'door' | 'npc' | 'plot' | 'bath' | 'bed' | 'shop', id?: string | number) => void;
  onInteractPlot?: (plotId: number) => void;
  activeAction: 'none' | 'bath' | 'sleep' | 'harvest';
  movementVector: { x: number; y: number };
}

export const VillageCanvas: React.FC<VillageCanvasProps> = ({
  gameState,
  onUpdatePlayerPos,
  onInteract,
  onInteractPlot,
  activeAction,
  movementVector,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Position and movement refs for 60fps smooth loop
  const playerRef = useRef({
    x: gameState.playerPos.x,
    y: gameState.playerPos.y,
    zone: gameState.playerPos.zone,
    direction: gameState.playerPos.direction,
    isMoving: false,
    walkFrame: 0,
  });

  const lastStepTimeRef = useRef<number>(0);

  // Synchronize ref when external zone teleport occurs
  useEffect(() => {
    playerRef.current.zone = gameState.playerPos.zone;
    playerRef.current.x = gameState.playerPos.x;
    playerRef.current.y = gameState.playerPos.y;
  }, [gameState.playerPos.zone, gameState.playerPos.x, gameState.playerPos.y]);

  // Handle collision check
  const checkCollision = useCallback((newX: number, newY: number, zone: Zone): boolean => {
    const pRadius = 14;

    if (zone === 'village') {
      // Boundaries
      if (newX - pRadius < 30 || newX + pRadius > WORLD_WIDTH - 30) return true;
      if (newY - pRadius < 50 || newY + pRadius > WORLD_HEIGHT - 30) return true;

      // Building collisions (except door regions)
      for (const b of BUILDINGS) {
        const doorMargin = 22;
        const isNearDoor =
          Math.abs(newX - b.doorX) < doorMargin &&
          Math.abs(newY - (b.doorY + 10)) < doorMargin;

        if (isNearDoor) {
          // Allow walking into door threshold
          continue;
        }

        // Solid walls
        if (
          newX + pRadius > b.x &&
          newX - pRadius < b.x + b.width &&
          newY + pRadius > b.y &&
          newY - pRadius < b.y + b.height
        ) {
          return true;
        }
      }

      // Town Square Fountain collision
      const fX = 480;
      const fY = 350;
      const fDist = Math.hypot(newX - fX, newY - fY);
      if (fDist < 42) return true;

      // Garden fence boundaries (with entrance opening on top)
      const g = GARDEN_AREA;
      const isGardenGate = Math.abs(newX - (g.x + g.width / 2)) < 30 && Math.abs(newY - g.y) < 16;
      if (!isGardenGate) {
        // North fence
        if (newY > g.y - 10 && newY < g.y + 10 && newX > g.x && newX < g.x + g.width) return true;
      }
      // South fence
      if (newY > g.y + g.height - 10 && newY < g.y + g.height + 10 && newX > g.x && newX < g.x + g.width) return true;
      // West fence
      if (newX > g.x - 10 && newX < g.x + 10 && newY > g.y && newY < g.y + g.height) return true;
      // East fence
      if (newX > g.x + g.width - 10 && newX < g.x + g.width + 10 && newY > g.y && newY < g.y + g.height) return true;

      // Decorative trees collisions
      const treePositions = [
        { x: 300, y: 150 },
        { x: 620, y: 150 },
        { x: 60, y: 160 },
        { x: 880, y: 160 },
        { x: 70, y: 520 },
        { x: 880, y: 520 },
        { x: 300, y: 780 },
        { x: 620, y: 780 },
      ];
      for (const t of treePositions) {
        if (Math.hypot(newX - t.x, newY - t.y) < 26) return true;
      }

    } else {
      // Interior boundaries (640x480)
      const minX = 70;
      const maxX = 570;
      const minY = 90;
      const maxY = 420;

      if (newX - pRadius < minX || newX + pRadius > maxX) return true;
      if (newY - pRadius < minY || newY + pRadius > maxY) return true;

      if (zone === 'player_house') {
        // Bed collision: Top-Right (450, 110, w: 90, h: 90)
        if (newX + pRadius > 450 && newX - pRadius < 540 && newY + pRadius > 110 && newY - pRadius < 200) {
          return true;
        }
        // Bath collision: Top-Left (90, 110, w: 90, h: 80)
        if (newX + pRadius > 90 && newX - pRadius < 180 && newY + pRadius > 110 && newY - pRadius < 190) {
          return true;
        }
      }
    }

    return false;
  }, []);

  // Main Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;
    let tick = 0;

    const gameLoop = () => {
      if (!running) return;
      tick++;

      // Update player movement if not currently doing a static animation (bath/sleep)
      if (activeAction === 'none') {
        let vx = movementVector.x;
        let vy = movementVector.y;

        const speed = 3.2;
        const length = Math.hypot(vx, vy);
        if (length > 0) {
          vx = (vx / length) * speed;
          vy = (vy / length) * speed;

          const currentP = playerRef.current;
          let nextX = currentP.x + vx;
          let nextY = currentP.y + vy;

          // X axis
          if (!checkCollision(nextX, currentP.y, currentP.zone)) {
            currentP.x = nextX;
          }
          // Y axis
          if (!checkCollision(currentP.x, nextY, currentP.zone)) {
            currentP.y = nextY;
          }

          currentP.isMoving = true;
          currentP.walkFrame += 0.2;

          // Footstep sound
          const now = Date.now();
          if (now - lastStepTimeRef.current > 280) {
            soundManager.playStep();
            lastStepTimeRef.current = now;
          }

          if (Math.abs(vx) > Math.abs(vy)) {
            currentP.direction = vx > 0 ? 'right' : 'left';
          } else {
            currentP.direction = vy > 0 ? 'down' : 'up';
          }

          onUpdatePlayerPos(currentP.x, currentP.y, currentP.zone, currentP.direction);
        } else {
          playerRef.current.isMoving = false;
        }
      }

      // Check proximity interactions
      const p = playerRef.current;

      // Clear Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Camera Transform: keep player centered with boundary clamping
      ctx.save();

      let camX = canvas.width / 2 - p.x;
      let camY = canvas.height / 2 - p.y;

      if (p.zone === 'village') {
        camX = Math.min(0, Math.max(canvas.width - WORLD_WIDTH, camX));
        camY = Math.min(0, Math.max(canvas.height - WORLD_HEIGHT, camY));
      } else {
        // Interiors are 640 x 480
        camX = (canvas.width - 640) / 2;
        camY = (canvas.height - 480) / 2;
      }

      ctx.translate(Math.round(camX), Math.round(camY));

      // Draw Scene
      if (p.zone === 'village') {
        drawVillage(ctx, tick, gameState.plots);
      } else {
        drawInterior(ctx, p.zone, tick, gameState);
      }

      // Draw NPCs in village
      if (p.zone === 'village') {
        drawNPCsInVillage(ctx, tick);
      }

      // Draw Player Cat
      drawPlayer(ctx, p, tick, activeAction);

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [activeAction, movementVector, checkCollision, gameState, onUpdatePlayerPos]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle direct click on garden plots or harvest buttons
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const p = playerRef.current;
    if (p.zone !== 'village') return;

    // Convert screen coordinates to world coordinates taking camera into account
    let camX = canvas.width / 2 - p.x;
    let camY = canvas.height / 2 - p.y;
    camX = Math.min(0, Math.max(canvas.width - WORLD_WIDTH, camX));
    camY = Math.min(0, Math.max(canvas.height - WORLD_HEIGHT, camY));

    const worldX = clickX - camX;
    const worldY = clickY - camY;

    // Check each plot and its harvest button area
    for (const pos of PLOT_POSITIONS) {
      const inX = worldX >= pos.x - 12 && worldX <= pos.x + pos.width + 12;
      const inY = worldY >= pos.y - 28 && worldY <= pos.y + pos.height + 12;

      if (inX && inY) {
        if (onInteractPlot) {
          onInteractPlot(pos.id);
        } else {
          onInteract('plot', pos.id);
        }
        return;
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      id="game-canvas"
      onClick={handleCanvasClick}
      className="absolute inset-0 w-full h-full block bg-[#9edb74] cursor-pointer"
    />
  );
};

// ================= RENDER FUNCTIONS =================

function drawVillage(ctx: CanvasRenderingContext2D, tick: number, plots: StarPlantPlot[]) {
  // 1. Lush Green Grass background with gentle color variance
  ctx.fillStyle = '#9edb74';
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  // Soft grass patches
  ctx.fillStyle = '#91cf64';
  for (let gx = 40; gx < WORLD_WIDTH; gx += 90) {
    for (let gy = 40; gy < WORLD_HEIGHT; gy += 90) {
      const offset = (gx * 13 + gy * 7) % 30;
      ctx.beginPath();
      ctx.arc(gx + offset, gy + offset, 16, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 2. Cobblestone & Dirt Paths
  ctx.fillStyle = '#ebd6b3';
  ctx.strokeStyle = '#d7c19b';
  ctx.lineWidth = 3;

  // North-South main path
  ctx.fillRect(450, 180, 60, 680);
  ctx.strokeRect(450, 180, 60, 680);

  // West-East cross path
  ctx.fillRect(150, 320, 680, 60);
  ctx.strokeRect(150, 320, 680, 60);

  // Branch to Dog House
  ctx.fillRect(160, 380, 60, 360);
  ctx.strokeRect(160, 380, 60, 360);

  // Branch to Bear House
  ctx.fillRect(740, 380, 60, 360);
  ctx.strokeRect(740, 380, 60, 360);

  // 3. Town Square Plaza (Circular brick area around fountain)
  ctx.fillStyle = '#f5e4cc';
  ctx.beginPath();
  ctx.arc(480, 350, 75, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Town Square Fountain
  drawFountain(ctx, 480, 350, tick);

  // 4. Buildings
  BUILDINGS.forEach((b) => {
    drawBuilding(ctx, b, tick);
  });

  // 5. Garden Area & Star Plots
  drawGarden(ctx, plots, tick);

  // 6. Village Trees & Flowers
  drawDecorations(ctx, tick);
}

function drawBuilding(ctx: CanvasRenderingContext2D, b: (typeof BUILDINGS)[0], tick: number) {
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.14)';
  ctx.beginPath();
  ctx.ellipse(b.x + b.width / 2, b.y + b.height + 4, b.width / 2 + 10, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Walls
  ctx.fillStyle = b.wallColor;
  ctx.strokeStyle = '#6d4c41';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(b.x, b.y + 35, b.width, b.height - 35, [0, 0, 12, 12]);
  ctx.fill();
  ctx.stroke();

  // Roof (Charming overhang)
  ctx.fillStyle = b.roofColor;
  ctx.beginPath();
  ctx.roundRect(b.x - 10, b.y, b.width + 20, 45, [18, 18, 6, 6]);
  ctx.fill();
  ctx.stroke();

  // Roof scallop lines
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(b.x, b.y + 15);
  ctx.lineTo(b.x + b.width, b.y + 15);
  ctx.moveTo(b.x, b.y + 30);
  ctx.lineTo(b.x + b.width, b.y + 30);
  ctx.stroke();

  // Chimney & smoke for Player and Bear House
  if (b.id === 'player_house' || b.id === 'bear_house') {
    ctx.fillStyle = '#b0bec5';
    ctx.strokeStyle = '#455a64';
    ctx.lineWidth = 2;
    ctx.fillRect(b.x + 20, b.y - 18, 22, 26);
    ctx.strokeRect(b.x + 20, b.y - 18, 22, 26);

    // Smoke puff
    const smokeY = (tick * 0.4) % 30;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(b.x + 31 + Math.sin(tick * 0.05) * 4, b.y - 25 - smokeY, 6 + smokeY * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Windows with cozy curtains
  const winY = b.y + 48;
  const leftWinX = b.x + 18;
  const rightWinX = b.x + b.width - 44;

  [leftWinX, rightWinX].forEach((wx) => {
    ctx.fillStyle = '#fffde7';
    ctx.strokeStyle = '#795548';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(wx, winY, 26, 26, 6);
    ctx.fill();
    ctx.stroke();

    // Window cross
    ctx.strokeStyle = '#8d6e63';
    ctx.beginPath();
    ctx.moveTo(wx + 13, winY);
    ctx.lineTo(wx + 13, winY + 26);
    ctx.moveTo(wx, winY + 13);
    ctx.lineTo(wx + 26, winY + 13);
    ctx.stroke();
  });

  // Doorway
  ctx.fillStyle = '#795548';
  ctx.strokeStyle = '#4e342e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(b.doorX - 16, b.y + b.height - 38, 32, 38, [14, 14, 0, 0]);
  ctx.fill();
  ctx.stroke();

  // Golden doorknob
  ctx.fillStyle = '#fbc02d';
  ctx.beginPath();
  ctx.arc(b.doorX + 8, b.y + b.height - 18, 3, 0, Math.PI * 2);
  ctx.fill();

  // Welcome mat
  ctx.fillStyle = '#e0e0e0';
  ctx.beginPath();
  ctx.roundRect(b.doorX - 18, b.y + b.height + 1, 36, 10, 4);
  ctx.fill();

  // Name sign / Header badge
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#8d6e63';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(b.x + b.width / 2 - 45, b.y - 20, 90, 22, 11);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#4e342e';
  ctx.font = 'bold 12px Fredoka, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${b.icon} ${b.name.split(' ')[0]}`, b.x + b.width / 2, b.y - 5);
}

function drawFountain(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number) {
  // Outer Stone Ring
  ctx.fillStyle = '#b0bec5';
  ctx.strokeStyle = '#546e7a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 38, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Sparkling Blue Water
  ctx.fillStyle = '#4fc3f7';
  ctx.beginPath();
  ctx.arc(x, y, 30, 0, Math.PI * 2);
  ctx.fill();

  // Water ripples
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 2;
  const rippleR = (tick * 0.5) % 24;
  ctx.beginPath();
  ctx.arc(x, y, rippleR, 0, Math.PI * 2);
  ctx.stroke();

  // Center column
  ctx.fillStyle = '#cfd8dc';
  ctx.strokeStyle = '#78909c';
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Water Jet droplets
  ctx.fillStyle = '#e1f5fe';
  for (let i = 0; i < 4; i++) {
    const angle = (tick * 0.08 + (i * Math.PI) / 2);
    const dropDist = 14 + Math.sin(tick * 0.1 + i) * 6;
    ctx.beginPath();
    ctx.arc(x + Math.cos(angle) * dropDist, y + Math.sin(angle) * dropDist, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGarden(ctx: CanvasRenderingContext2D, plots: StarPlantPlot[], tick: number) {
  const g = GARDEN_AREA;

  // Garden fence
  ctx.strokeStyle = '#8d6e63';
  ctx.lineWidth = 4;
  ctx.strokeRect(g.x, g.y, g.width, g.height);

  // Garden Soil Bed
  ctx.fillStyle = '#c7a379';
  ctx.fillRect(g.x + 4, g.y + 4, g.width - 8, g.height - 8);

  // Garden Signboard
  ctx.fillStyle = '#ffe082';
  ctx.strokeStyle = '#8d6e63';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(g.x + g.width / 2 - 50, g.y - 24, 100, 22, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#5d4037';
  ctx.font = 'bold 12px Fredoka, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⭐ Star Garden', g.x + g.width / 2, g.y - 8);

  // Draw each of the 4 plots
  PLOT_POSITIONS.forEach((pos) => {
    const plotData = plots.find((p) => p.id === pos.id);
    drawPlot(ctx, pos.x, pos.y, pos.width, pos.height, plotData, tick);
  });
}

function drawPlot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  plot: StarPlantPlot | undefined,
  tick: number,
) {
  // Rich tilled brown soil plot
  ctx.fillStyle = '#6d4c41';
  ctx.strokeStyle = '#4e342e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();
  ctx.stroke();

  // Soil grooves
  ctx.strokeStyle = '#5d4037';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 10, y + 18);
  ctx.lineTo(x + w - 10, y + 18);
  ctx.moveTo(x + 10, y + 32);
  ctx.lineTo(x + w - 10, y + 32);
  ctx.moveTo(x + 10, y + 46);
  ctx.lineTo(x + w - 10, y + 46);
  ctx.stroke();

  const centerX = x + w / 2;
  const centerY = y + h / 2;

  if (!plot || plot.stage === 0) {
    // Empty Plot
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = 'bold 10px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Empty', centerX, centerY - 2);
    ctx.fillText('Soil', centerX, centerY + 12);
  } else if (plot.stage === 1) {
    // Stage 1: Small sprout
    ctx.fillStyle = '#66bb6a';
    ctx.beginPath();
    ctx.arc(centerX - 5, centerY, 6, Math.PI, Math.PI * 2);
    ctx.arc(centerX + 5, centerY, 6, Math.PI, Math.PI * 2);
    ctx.fill();

    // Stem
    ctx.strokeStyle = '#43a047';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + 8);
    ctx.lineTo(centerX, centerY - 2);
    ctx.stroke();

    // Tiny star glimmer
    ctx.fillStyle = '#fff176';
    ctx.beginPath();
    ctx.arc(centerX, centerY - 5, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (plot.stage === 2) {
    // Stage 2: Growing stem with glowing star bud
    const bob = Math.sin(tick * 0.1) * 2;
    ctx.strokeStyle = '#43a047';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + 12);
    ctx.lineTo(centerX, centerY - 10 + bob);
    ctx.stroke();

    // Green leaf arms
    ctx.fillStyle = '#81c784';
    ctx.beginPath();
    ctx.ellipse(centerX - 10, centerY - 2 + bob, 8, 4, -0.4, 0, Math.PI * 2);
    ctx.ellipse(centerX + 10, centerY - 2 + bob, 8, 4, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Glowing Star Bud
    ctx.fillStyle = '#fdd835';
    ctx.beginPath();
    ctx.arc(centerX, centerY - 12 + bob, 8, 0, Math.PI * 2);
    ctx.fill();

    // Glow ring
    ctx.strokeStyle = 'rgba(253, 216, 53, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY - 12 + bob, 12, 0, Math.PI * 2);
    ctx.stroke();
  } else if (plot.stage === 3) {
    // Stage 3: Fully mature STAR PLANT!
    const bounce = Math.sin(tick * 0.15) * 4;
    const pulse = 1 + Math.sin(tick * 0.2) * 0.15;

    // Glowing aura
    ctx.fillStyle = 'rgba(255, 235, 59, 0.25)';
    ctx.beginPath();
    ctx.arc(centerX, centerY - 14 + bounce, 24 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Stalk & Lush Leaves
    ctx.strokeStyle = '#2e7d32';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + 14);
    ctx.lineTo(centerX, centerY - 10 + bounce);
    ctx.stroke();

    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.ellipse(centerX - 12, centerY - 2 + bounce, 10, 5, -0.5, 0, Math.PI * 2);
    ctx.ellipse(centerX + 12, centerY - 2 + bounce, 10, 5, 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Big 5-pointed Golden Star!
    drawStar(ctx, centerX, centerY - 14 + bounce, 5, 14 * pulse, 7 * pulse, '#ffb300', '#fff9c4');

    // Sparkle specks
    const spX = centerX + Math.cos(tick * 0.1) * 18;
    const spY = centerY - 14 + bounce + Math.sin(tick * 0.1) * 18;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(spX, spY, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Floating Progress Bar or "READY TO HARVEST" Badge
  if (plot && plot.stage > 0) {
    if (plot.stage === 3) {
      // Ready pill
      ctx.fillStyle = '#ff8f00';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(centerX - 36, y - 18, 72, 16, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⭐ HARVEST!', centerX, y - 6);
    } else {
      // Growing Progress Bar
      const pWidth = 46;
      const pHeight = 8;
      const barX = centerX - pWidth / 2;
      const barY = y - 14;

      // Track
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.beginPath();
      ctx.roundRect(barX, barY, pWidth, pHeight, 4);
      ctx.fill();

      // Fill
      ctx.fillStyle = '#66bb6a';
      const fillW = Math.max(4, Math.round((plot.progress / 100) * (pWidth - 2)));
      ctx.beginPath();
      ctx.roundRect(barX + 1, barY + 1, fillW, pHeight - 2, 3);
      ctx.fill();

      // Percentage text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${plot.progress}%`, centerX, barY - 2);
    }
  }
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number,
  fillColor: string,
  strokeColor: string,
) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = strokeColor;
  ctx.stroke();
}

function drawDecorations(ctx: CanvasRenderingContext2D, tick: number) {
  const treePositions = [
    { x: 300, y: 150 },
    { x: 620, y: 150 },
    { x: 60, y: 160 },
    { x: 880, y: 160 },
    { x: 70, y: 520 },
    { x: 880, y: 520 },
    { x: 300, y: 780 },
    { x: 620, y: 780 },
  ];

  treePositions.forEach((t) => {
    // Tree Trunk
    ctx.fillStyle = '#795548';
    ctx.fillRect(t.x - 8, t.y, 16, 28);

    // Tree Foliage
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.arc(t.x, t.y - 12, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#66bb6a';
    ctx.beginPath();
    ctx.arc(t.x - 6, t.y - 18, 18, 0, Math.PI * 2);
    ctx.fill();

    // Red berries / apples
    ctx.fillStyle = '#ef5350';
    ctx.beginPath();
    ctx.arc(t.x - 10, t.y - 10, 4, 0, Math.PI * 2);
    ctx.arc(t.x + 12, t.y - 14, 4, 0, Math.PI * 2);
    ctx.arc(t.x + 2, t.y - 24, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // Flower patches
  const flowers = [
    { x: 380, y: 330, c: '#e91e63' },
    { x: 570, y: 330, c: '#ffeb3b' },
    { x: 260, y: 460, c: '#ba68c8' },
    { x: 690, y: 460, c: '#ff9800' },
  ];

  flowers.forEach((f) => {
    ctx.fillStyle = f.c;
    ctx.beginPath();
    ctx.arc(f.x, f.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(f.x, f.y, 2, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawNPCsInVillage(ctx: CanvasRenderingContext2D, tick: number) {
  NPCS.forEach((npc) => {
    const bob = Math.sin(tick * 0.1 + (npc.species === 'bunny' ? 1 : 2)) * 3;
    const x = npc.villageX;
    const y = npc.villageY;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(x, y + 14, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Species specific rendering
    if (npc.species === 'bunny') {
      // White/pink bunny
      // Ears
      ctx.fillStyle = '#fce4ec';
      ctx.strokeStyle = '#f8bbd0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x - 6, y - 18 + bob, 4, 12, -0.1, 0, Math.PI * 2);
      ctx.ellipse(x + 6, y - 18 + bob, 4, 12, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Body & Head
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y + bob, 13, 0, Math.PI * 2);
      ctx.fill();

      // Eyes & blush
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(x - 4, y - 1 + bob, 2, 0, Math.PI * 2);
      ctx.arc(x + 4, y - 1 + bob, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff80ab';
      ctx.beginPath();
      ctx.arc(x - 7, y + 3 + bob, 2.5, 0, Math.PI * 2);
      ctx.arc(x + 7, y + 3 + bob, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (npc.species === 'dog') {
      // Puppy with floppy ears
      ctx.fillStyle = '#ffe0b2';
      ctx.beginPath();
      ctx.arc(x, y + bob, 14, 0, Math.PI * 2);
      ctx.fill();

      // Floppy ears
      ctx.fillStyle = '#bcaaa4';
      ctx.beginPath();
      ctx.ellipse(x - 13, y - 3 + bob, 6, 9, 0.4, 0, Math.PI * 2);
      ctx.ellipse(x + 13, y - 3 + bob, 6, 9, -0.4, 0, Math.PI * 2);
      ctx.fill();

      // Snout
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(x, y + 4 + bob, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#4e342e';
      ctx.beginPath();
      ctx.arc(x, y + 3 + bob, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (npc.species === 'bear') {
      // Bear
      ctx.fillStyle = '#bcaaa4';
      ctx.beginPath();
      ctx.arc(x, y + bob, 15, 0, Math.PI * 2);
      ctx.fill();

      // Round ears
      ctx.beginPath();
      ctx.arc(x - 12, y - 12 + bob, 5, 0, Math.PI * 2);
      ctx.arc(x + 12, y - 12 + bob, 5, 0, Math.PI * 2);
      ctx.fill();

      // Snout
      ctx.fillStyle = '#efebe9';
      ctx.beginPath();
      ctx.ellipse(x, y + 4 + bob, 7, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3e2723';
      ctx.beginPath();
      ctx.arc(x, y + 3 + bob, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Name tag
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.strokeStyle = '#8d6e63';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x - 30, y - 28 + bob, 60, 14, 7);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#4e342e';
    ctx.font = 'bold 9px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(npc.name, x, y - 18 + bob);
  });
}

function drawInterior(
  ctx: CanvasRenderingContext2D,
  zone: Zone,
  tick: number,
  gameState: GameSaveData,
) {
  // Room is centered at (0, 0) relative to translated camera (640 x 480)
  const rw = 640;
  const rh = 480;

  // Background wall
  let wallColor = '#fff9c4';
  let floorColor = '#ffecb3';
  let title = 'Rumah Pemain';

  if (zone === 'npc_house_bunny') {
    wallColor = '#fce4ec';
    floorColor = '#f8bbd0';
    title = 'Rumah Bunny Mimi 🐰';
  } else if (zone === 'npc_house_dog') {
    wallColor = '#fff3e0';
    floorColor = '#ffe0b2';
    title = 'Rumah Puppy Bobby 🐶';
  } else if (zone === 'npc_house_bear') {
    wallColor = '#efebe9';
    floorColor = '#d7ccc8';
    title = 'Rumah Bear Kuma 🐻';
  } else if (zone === 'shop_interior') {
    wallColor = '#e1f5fe';
    floorColor = '#b3e5fc';
    title = 'Toko Desa 🏪';
  }

  // Outer border / walls
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(50, 40, rw - 100, rh - 60);

  // Wallpaper
  ctx.fillStyle = wallColor;
  ctx.fillRect(60, 50, rw - 120, 160);

  // Wallpaper stripes
  ctx.strokeStyle = 'rgba(0,0,0,0.04)';
  ctx.lineWidth = 2;
  for (let wx = 70; wx < rw - 70; wx += 24) {
    ctx.beginPath();
    ctx.moveTo(wx, 50);
    ctx.lineTo(wx, 210);
    ctx.stroke();
  }

  // Wooden baseboard
  ctx.fillStyle = '#8d6e63';
  ctx.fillRect(60, 205, rw - 120, 8);

  // Cozy Floorboards
  ctx.fillStyle = floorColor;
  ctx.fillRect(60, 213, rw - 120, rh - 243);

  // Floorboard planks lines
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 1;
  for (let fy = 240; fy < rh - 40; fy += 30) {
    ctx.beginPath();
    ctx.moveTo(60, fy);
    ctx.lineTo(rw - 60, fy);
    ctx.stroke();
  }

  // Room Header Sign
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#8d6e63';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(rw / 2 - 80, 15, 160, 28, 14);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#5d4037';
  ctx.font = 'bold 13px Fredoka, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, rw / 2, 34);

  // Exit Door at Bottom Center
  ctx.fillStyle = '#795548';
  ctx.fillRect(rw / 2 - 35, rh - 45, 70, 20);
  ctx.fillStyle = '#ffe082';
  ctx.beginPath();
  ctx.roundRect(rw / 2 - 30, rh - 40, 60, 14, 4);
  ctx.fill();
  ctx.fillStyle = '#5d4037';
  ctx.font = 'bold 10px Fredoka, sans-serif';
  ctx.fillText('🚪 KELUAR', rw / 2, rh - 30);

  // Specific Room Contents
  if (zone === 'player_house') {
    // 1. Bed (Top Right: 450, 110, w: 90, h: 90)
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#b0bec5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(450, 110, 90, 86, 12);
    ctx.fill();
    ctx.stroke();

    // Duvet
    ctx.fillStyle = '#90caf9';
    ctx.beginPath();
    ctx.roundRect(450, 140, 90, 56, [0, 0, 12, 12]);
    ctx.fill();

    // Pillow
    ctx.fillStyle = '#fffde7';
    ctx.beginPath();
    ctx.roundRect(465, 116, 60, 20, 8);
    ctx.fill();

    ctx.fillStyle = '#1565c0';
    ctx.font = 'bold 10px Fredoka, sans-serif';
    ctx.fillText('🛏️ Tempat Tidur', 495, 175);

    // 2. Bathtub (Top Left: 90, 110, w: 90, h: 80)
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#90caf9';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(90, 110, 90, 80, 16);
    ctx.fill();
    ctx.stroke();

    // Water inside tub
    ctx.fillStyle = '#80deea';
    ctx.beginPath();
    ctx.roundRect(98, 125, 74, 56, 12);
    ctx.fill();

    // Bubbles
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(120, 140, 7, 0, Math.PI * 2);
    ctx.arc(135, 138, 9, 0, Math.PI * 2);
    ctx.arc(150, 144, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#00838f';
    ctx.font = 'bold 10px Fredoka, sans-serif';
    ctx.fillText('🛁 Kamar Mandi', 135, 172);

    // 3. Placed Decorations
    gameState.placedDecorations.forEach((deco, index) => {
      const decoX = 230 + index * 90;
      const decoY = 160;

      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.beginPath();
      ctx.ellipse(decoX, decoY + 12, 16, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '28px serif';
      ctx.textAlign = 'center';
      ctx.fillText(deco.icon, decoX, decoY + 4);

      ctx.fillStyle = '#6d4c41';
      ctx.font = 'bold 9px Fredoka, sans-serif';
      ctx.fillText(deco.name, decoX, decoY + 24);
    });

    // Cozy Center Rug
    ctx.fillStyle = '#ffe082';
    ctx.strokeStyle = '#ffd54f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(320, 310, 70, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ff8f00';
    ctx.font = '16px serif';
    ctx.fillText('⭐', 320, 315);
  } else if (zone === 'shop_interior') {
    // Shopkeeper counter
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(200, 140, 240, 45);

    // Owl / Cat Shopkeeper
    ctx.fillStyle = '#ffd54f';
    ctx.beginPath();
    ctx.arc(320, 115, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '24px serif';
    ctx.fillText('🦉', 320, 122);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Fredoka, sans-serif';
    ctx.fillText('Kakek Owl (Shopkeeper)', 320, 165);

    // Display shelves
    ctx.fillStyle = '#bcaaa4';
    ctx.fillRect(80, 80, 80, 90);
    ctx.fillRect(480, 80, 80, 90);
    ctx.font = '22px serif';
    ctx.fillText('🍎 🍰', 120, 125);
    ctx.fillText('⭐ 🌱', 520, 125);
  } else {
    // NPC Home: NPC standing inside
    const npc = NPCS.find((n) => n.houseId === zone);
    if (npc) {
      const nx = rw / 2;
      const ny = 240;
      const bob = Math.sin(tick * 0.1) * 3;

      // Soft rug
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.ellipse(nx, ny + 20, 50, 26, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw larger cute version of NPC
      ctx.font = '48px serif';
      ctx.textAlign = 'center';
      const emoji = npc.species === 'bunny' ? '🐰' : npc.species === 'dog' ? '🐶' : '🐻';
      ctx.fillText(emoji, nx, ny + bob);

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#8d6e63';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(nx - 45, ny + 32, 90, 18, 9);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#4e342e';
      ctx.font = 'bold 10px Fredoka, sans-serif';
      ctx.fillText(npc.name, nx, ny + 45);
    }
  }
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  player: { x: number; y: number; direction: Direction; isMoving: boolean; walkFrame: number },
  tick: number,
  activeAction: 'none' | 'bath' | 'sleep' | 'harvest',
) {
  const x = player.x;
  const y = player.y;

  // Custom Bath Animation
  if (activeAction === 'bath') {
    // Water splashes & soap bubbles around player
    for (let i = 0; i < 6; i++) {
      const bubbleAngle = tick * 0.1 + i * 1.1;
      const bx = x + Math.cos(bubbleAngle) * 22;
      const by = y - 10 + Math.sin(bubbleAngle) * 16 - ((tick * 0.5) % 18);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.strokeStyle = '#4dd0e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(bx, by, 5 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    // Sparkles
    ctx.font = '16px serif';
    ctx.textAlign = 'center';
    ctx.fillText('✨🧼✨', x, y - 26);
  }

  // Custom Sleep Animation
  if (activeAction === 'sleep') {
    const floatZ = (tick * 0.4) % 24;
    ctx.fillStyle = '#5c6bc0';
    ctx.font = 'bold 16px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Z', x + 12, y - 18 - floatZ);
    ctx.font = 'bold 12px Fredoka, sans-serif';
    ctx.fillText('z', x + 6, y - 12 - floatZ * 0.8);
    ctx.font = 'bold 9px Fredoka, sans-serif';
    ctx.fillText('z', x + 1, y - 8 - floatZ * 0.5);
  }

  // Walking bounce calculation
  const walkBob = player.isMoving ? Math.sin(player.walkFrame * 2) * 3 : 0;
  const tailWag = Math.sin(tick * 0.15) * 6;

  // Player Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(x, y + 15, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // === CHIBI CAT BODY ===
  // Fluffy Tail
  ctx.strokeStyle = '#ffb74d';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  const tailX = player.direction === 'left' ? x + 12 : x - 12;
  ctx.moveTo(tailX, y + 8 + walkBob);
  ctx.quadraticCurveTo(tailX + (player.direction === 'left' ? 8 : -8), y - 2 + walkBob + tailWag, tailX + (player.direction === 'left' ? 14 : -14), y - 8 + walkBob);
  ctx.stroke();

  // Round Body
  ctx.fillStyle = '#fff3e0'; // Warm cream fur
  ctx.beginPath();
  ctx.arc(x, y + 4 + walkBob, 14, 0, Math.PI * 2);
  ctx.fill();

  // White Tummy Patch
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(x, y + 6 + walkBob, 8, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Paws
  ctx.fillStyle = '#ffffff';
  const legOffset = player.isMoving ? Math.sin(player.walkFrame * 2) * 4 : 0;
  ctx.beginPath();
  ctx.arc(x - 7, y + 14 + walkBob + legOffset, 4, 0, Math.PI * 2);
  ctx.arc(x + 7, y + 14 + walkBob - legOffset, 4, 0, Math.PI * 2);
  ctx.fill();

  // Cat Head
  const headY = y - 8 + walkBob;
  ctx.fillStyle = '#ffe0b2';
  ctx.beginPath();
  ctx.arc(x, headY, 15, 0, Math.PI * 2);
  ctx.fill();

  // Cat Ears (Pointy triangles with pink inner ears)
  const earLeftX = x - 11;
  const earRightX = x + 11;
  const earTopY = headY - 18;

  // Left Ear
  ctx.fillStyle = '#ffb74d';
  ctx.beginPath();
  ctx.moveTo(earLeftX - 4, headY - 8);
  ctx.lineTo(earLeftX, earTopY);
  ctx.lineTo(earLeftX + 6, headY - 11);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#f8bbd0'; // Pink inner
  ctx.beginPath();
  ctx.moveTo(earLeftX - 2, headY - 8);
  ctx.lineTo(earLeftX, earTopY + 4);
  ctx.lineTo(earLeftX + 4, headY - 10);
  ctx.closePath();
  ctx.fill();

  // Right Ear
  ctx.fillStyle = '#ffb74d';
  ctx.beginPath();
  ctx.moveTo(earRightX - 6, headY - 11);
  ctx.lineTo(earRightX, earTopY);
  ctx.lineTo(earRightX + 4, headY - 8);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#f8bbd0';
  ctx.beginPath();
  ctx.moveTo(earRightX - 4, headY - 10);
  ctx.lineTo(earRightX, earTopY + 4);
  ctx.lineTo(earRightX + 2, headY - 8);
  ctx.closePath();
  ctx.fill();

  // Calico orange patch on head
  ctx.fillStyle = '#ffb74d';
  ctx.beginPath();
  ctx.arc(x + 7, headY - 7, 7, 0, Math.PI * 2);
  ctx.fill();

  // Face features (Eyes, Blushing cheeks, whiskers, smile)
  if (player.direction !== 'up') {
    // Big Kawaii Anime Eyes
    ctx.fillStyle = '#37474f';
    const eyeSpacing = 6;
    const eyeY = headY - 1;

    let eyeLookX = 0;
    if (player.direction === 'left') eyeLookX = -2;
    if (player.direction === 'right') eyeLookX = 2;

    ctx.beginPath();
    ctx.ellipse(x - eyeSpacing + eyeLookX, eyeY, 3, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(x + eyeSpacing + eyeLookX, eyeY, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye sparkles (highlight reflection)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x - eyeSpacing + eyeLookX - 1, eyeY - 1.5, 1.2, 0, Math.PI * 2);
    ctx.arc(x + eyeSpacing + eyeLookX - 1, eyeY - 1.5, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Rosy Pink Cheeks
    ctx.fillStyle = 'rgba(255, 128, 171, 0.65)';
    ctx.beginPath();
    ctx.arc(x - 10 + eyeLookX, headY + 4, 3, 0, Math.PI * 2);
    ctx.arc(x + 10 + eyeLookX, headY + 4, 3, 0, Math.PI * 2);
    ctx.fill();

    // Tiny pink nose & :3 mouth
    ctx.fillStyle = '#f48fb1';
    ctx.beginPath();
    ctx.arc(x + eyeLookX, headY + 3, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Whiskers
    ctx.strokeStyle = '#8d6e63';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 9, headY + 2);
    ctx.lineTo(x - 18, headY + 1);
    ctx.moveTo(x - 9, headY + 4);
    ctx.lineTo(x - 17, headY + 6);

    ctx.moveTo(x + 9, headY + 2);
    ctx.lineTo(x + 18, headY + 1);
    ctx.moveTo(x + 9, headY + 4);
    ctx.lineTo(x + 17, headY + 6);
    ctx.stroke();
  } else {
    // Back of head (cute ears showing)
    ctx.fillStyle = '#ffb74d';
    ctx.beginPath();
    ctx.arc(x, headY - 4, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}
