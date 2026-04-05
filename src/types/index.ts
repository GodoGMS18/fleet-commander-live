export interface Point { x: number; y: number; }

export type RobotStatus = 'idle' | 'moving' | 'loading' | 'unloading' | 'charging' | 'waiting' | 'blocked' | 'error' | 'offline';

export interface Robot {
  id: string;
  name: string;
  type: 'forklift' | 'amr';
  position: Point;
  heading: number;
  status: RobotStatus;
  battery: number;
  speed: number;
  zone: string;
  currentTaskId: string | null;
  loadStatus: 'empty' | 'loaded';
  palletId: string | null;
  connectionState: 'online' | 'offline';
  lastUpdated: number;
  path: Point[];
  pathIndex: number;
  waitTicks: number;
}

export type TaskType = 'pick' | 'place' | 'rack-to-checkpoint' | 'checkpoint-to-rack' | 'rack-to-rack' | 'go-charge';
export type TaskStatus = 'pending' | 'assigned' | 'active' | 'loading' | 'transporting' | 'unloading' | 'completed' | 'cancelled' | 'failed';

export interface Task {
  id: string;
  assignedRobotId: string | null;
  type: TaskType;
  sourceZone: string;
  sourceRack: string;
  sourceTier: 'top' | 'bottom';
  sourceSlot: 'left' | 'right';
  destZone: string;
  destRack: string;
  destTier: 'top' | 'bottom';
  destSlot: 'left' | 'right';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: number;
  startedAt: number | null;
  completedAt: number | null;
  status: TaskStatus;
  palletId: string | null;
}

export interface PalletSlot {
  occupied: boolean;
  palletId: string | null;
}

export interface Rack {
  id: string;
  zone: string;
  position: Point;
  slots: { topLeft: PalletSlot; topRight: PalletSlot; bottomLeft: PalletSlot; bottomRight: PalletSlot; };
  reserved: boolean;
  reservedByTaskId: string | null;
}

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  id: string;
  robotId: string | null;
  severity: AlertSeverity;
  type: string;
  timestamp: number;
  description: string;
  acknowledged: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  eventType: string;
  robotId: string | null;
  userId: string | null;
  zone: string | null;
  description: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'supervisor' | 'operator';
}

export interface SimSettings {
  simulationSpeed: number;
  showGrid: boolean;
  showPaths: boolean;
  showLabels: boolean;
  enableAlerts: boolean;
  apiLatency: number;
}

export type SlotKey = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
