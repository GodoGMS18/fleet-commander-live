import { Rack, Robot, Task, Alert, LogEntry, SimSettings } from '@/types';

const rng = (seed: number) => {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
};
const rand = rng(42);

export const WAREHOUSE = {
  width: 1200, height: 800,
  boundary: { x: 30, y: 30, w: 1140, h: 740 },
  frontDoor: { x: 530, y: 30, w: 140, h: 50 },
  chargingStation: { x: 1040, y: 700, w: 120, h: 60 },
  loadingArea: { x: 460, y: 80, w: 280, h: 50 },
  mainAisleY: 390,
  zones: [
    { id: 'A', label: 'Zone A — High Value', x: 60, y: 140, w: 420, h: 220, color: '#1a3a5c' },
    { id: 'B', label: 'Zone B — Medium Value', x: 580, y: 140, w: 420, h: 160, color: '#1a4a3c' },
    { id: 'C', label: 'Zone C — Low Value', x: 60, y: 430, w: 420, h: 160, color: '#3a2a1a' },
    { id: 'D', label: 'Zone D — Mixed Storage', x: 580, y: 430, w: 420, h: 160, color: '#2a1a3a' },
  ],
};

const ZONE_CONFIGS = [
  { id: 'A', rows: 3, startY: 170, xStart: 110, xStep: 90 },
  { id: 'B', rows: 2, startY: 170, xStart: 630, xStep: 90 },
  { id: 'C', rows: 2, startY: 460, xStart: 110, xStep: 90 },
  { id: 'D', rows: 2, startY: 460, xStart: 630, xStep: 90 },
];

export function generateRacks(): Rack[] {
  const racks: Rack[] = [];
  for (const zone of ZONE_CONFIGS) {
    let n = 1;
    for (let row = 0; row < zone.rows; row++) {
      for (let col = 0; col < 5; col++) {
        const id = `${zone.id}-${String(n).padStart(2, '0')}`;
        const mkSlot = () => {
          const occ = rand() > 0.35;
          return { occupied: occ, palletId: occ ? `P-${id}-${Math.floor(rand() * 999)}` : null };
        };
        racks.push({
          id, zone: zone.id,
          position: { x: zone.xStart + col * zone.xStep, y: zone.startY + row * 70 },
          slots: { topLeft: mkSlot(), topRight: mkSlot(), bottomLeft: mkSlot(), bottomRight: mkSlot() },
          reserved: false, reservedByTaskId: null,
        });
        n++;
      }
    }
  }
  return racks;
}

export function generateRobots(): Robot[] {
  const positions = [
    { x: 200, y: 390 }, { x: 400, y: 390 }, { x: 700, y: 390 },
    { x: 900, y: 390 }, { x: 1040, y: 730 },
  ];
  return ['R001', 'R002', 'R003', 'R004', 'R005'].map((id, i) => ({
    id, name: `Robot ${id}`,
    type: (i < 3 ? 'forklift' : 'amr') as 'forklift' | 'amr',
    position: { ...positions[i] },
    heading: 0, status: i === 4 ? 'charging' as const : 'idle' as const,
    battery: i === 4 ? 35 : 60 + Math.floor(rand() * 40),
    speed: 3, zone: i < 2 ? 'A' : i < 4 ? 'B' : 'Charging',
    currentTaskId: null, loadStatus: 'empty' as const, palletId: null,
    connectionState: 'online' as const, lastUpdated: Date.now(),
    path: [], pathIndex: 0, waitTicks: 0,
  }));
}

export function generateInitialTasks(racks: Rack[]): Task[] {
  const occupied = racks.flatMap(r => {
    const slots: { rack: Rack; tier: 'top' | 'bottom'; slot: 'left' | 'right'; key: string }[] = [];
    if (r.slots.topLeft.occupied) slots.push({ rack: r, tier: 'top', slot: 'left', key: 'topLeft' });
    if (r.slots.topRight.occupied) slots.push({ rack: r, tier: 'top', slot: 'right', key: 'topRight' });
    if (r.slots.bottomLeft.occupied) slots.push({ rack: r, tier: 'bottom', slot: 'left', key: 'bottomLeft' });
    if (r.slots.bottomRight.occupied) slots.push({ rack: r, tier: 'bottom', slot: 'right', key: 'bottomRight' });
    return slots;
  });
  const empty = racks.flatMap(r => {
    const slots: { rack: Rack; tier: 'top' | 'bottom'; slot: 'left' | 'right'; key: string }[] = [];
    if (!r.slots.topLeft.occupied) slots.push({ rack: r, tier: 'top', slot: 'left', key: 'topLeft' });
    if (!r.slots.topRight.occupied) slots.push({ rack: r, tier: 'top', slot: 'right', key: 'topRight' });
    if (!r.slots.bottomLeft.occupied) slots.push({ rack: r, tier: 'bottom', slot: 'left', key: 'bottomLeft' });
    if (!r.slots.bottomRight.occupied) slots.push({ rack: r, tier: 'bottom', slot: 'right', key: 'bottomRight' });
    return slots;
  });
  const tasks: Task[] = [];
  const count = Math.min(3, occupied.length, empty.length);
  for (let i = 0; i < count; i++) {
    const src = occupied[i]; const dst = empty[i];
    tasks.push({
      id: `T-${String(i + 1).padStart(3, '0')}`,
      assignedRobotId: null,
      type: 'rack-to-rack',
      sourceZone: src.rack.zone, sourceRack: src.rack.id,
      sourceTier: src.tier, sourceSlot: src.slot,
      destZone: dst.rack.zone, destRack: dst.rack.id,
      destTier: dst.tier, destSlot: dst.slot,
      priority: (['medium', 'high', 'low'] as const)[i],
      createdAt: Date.now() - 60000 * (3 - i),
      startedAt: null, completedAt: null,
      status: 'pending',
      palletId: src.rack.slots[src.key as keyof typeof src.rack.slots].palletId,
    });
  }
  return tasks;
}

export const defaultSettings: SimSettings = {
  simulationSpeed: 1, showGrid: true, showPaths: true, showLabels: true,
  enableAlerts: true, apiLatency: 0,
};

export function computePath(from: { x: number; y: number }, to: { x: number; y: number }): { x: number; y: number }[] {
  const MY = WAREHOUSE.mainAisleY;
  const path: { x: number; y: number }[] = [];
  const dx = Math.abs(from.x - to.x);
  const dy = Math.abs(from.y - to.y);
  if (dx < 5 && dy < 5) return [to];
  if (dy < 5) return [to];
  // Route through main aisle
  if (Math.abs(from.y - MY) > 5) path.push({ x: from.x, y: MY });
  if (dx > 5) path.push({ x: to.x, y: MY });
  if (Math.abs(to.y - MY) > 5) path.push(to);
  else if (path.length === 0) path.push(to);
  return path;
}
