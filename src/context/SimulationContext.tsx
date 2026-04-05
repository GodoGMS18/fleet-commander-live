import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { Robot, Task, Rack, Alert, LogEntry, SimSettings, Point, SlotKey, TaskStatus, RobotStatus } from '@/types';
import { generateRacks, generateRobots, generateInitialTasks, defaultSettings, computePath, WAREHOUSE } from '@/mock/warehouse';

interface SimState {
  robots: Robot[];
  tasks: Task[];
  racks: Rack[];
  alerts: Alert[];
  logs: LogEntry[];
  settings: SimSettings;
  tickCount: number;
  selectedRobotId: string | null;
  selectedRackId: string | null;
}

type Action =
  | { type: 'TICK' }
  | { type: 'SET_SETTINGS'; payload: Partial<SimSettings> }
  | { type: 'ASSIGN_TASK'; taskId: string; robotId: string }
  | { type: 'CANCEL_TASK'; taskId: string }
  | { type: 'ACK_ALERT'; alertId: string }
  | { type: 'SELECT_ROBOT'; robotId: string | null }
  | { type: 'SELECT_RACK'; rackId: string | null }
  | { type: 'CREATE_TASK'; task: Task }
  | { type: 'RESET' }
  | { type: 'ESTOP'; robotId: string }
  | { type: 'RESUME'; robotId: string };

let logId = 1000;
let alertId = 1000;
let taskId = 100;

function addLog(logs: LogEntry[], desc: string, robotId?: string | null, zone?: string | null, eventType = 'system'): LogEntry[] {
  return [{ id: `L-${logId++}`, timestamp: Date.now(), eventType, robotId: robotId ?? null, userId: null, zone: zone ?? null, description: desc }, ...logs].slice(0, 200);
}

function addAlert(alerts: Alert[], desc: string, severity: 'info' | 'warning' | 'critical', type: string, robotId?: string | null): Alert[] {
  return [{ id: `ALT-${alertId++}`, robotId: robotId ?? null, severity, type, timestamp: Date.now(), description: desc, acknowledged: false }, ...alerts].slice(0, 100);
}

function getSlotKey(tier: 'top' | 'bottom', slot: 'left' | 'right'): SlotKey {
  return `${tier}${slot.charAt(0).toUpperCase()}${slot.slice(1)}` as SlotKey;
}

function dist(a: Point, b: Point) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }

function moveToward(pos: Point, target: Point, speed: number): Point {
  const d = dist(pos, target);
  if (d <= speed) return { ...target };
  const ratio = speed / d;
  return { x: pos.x + (target.x - pos.x) * ratio, y: pos.y + (target.y - pos.y) * ratio };
}

function headingTo(from: Point, to: Point): number {
  return Math.atan2(to.y - from.y, to.x - from.x) * (180 / Math.PI);
}

function reducer(state: SimState, action: Action): SimState {
  switch (action.type) {
    case 'SELECT_ROBOT': return { ...state, selectedRobotId: action.robotId };
    case 'SELECT_RACK': return { ...state, selectedRackId: action.rackId };
    case 'SET_SETTINGS': return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'ACK_ALERT': return { ...state, alerts: state.alerts.map(a => a.id === action.alertId ? { ...a, acknowledged: true } : a) };
    case 'RESET': {
      const racks = generateRacks();
      return { ...initialState(), racks, tasks: generateInitialTasks(racks) };
    }
    case 'ESTOP': {
      const robots = state.robots.map(r => r.id === action.robotId ? { ...r, status: 'error' as const, path: [], pathIndex: 0 } : r);
      return { ...state, robots, logs: addLog(state.logs, `Emergency stop: ${action.robotId}`, action.robotId, null, 'emergency'), alerts: addAlert(state.alerts, `Emergency stop triggered on ${action.robotId}`, 'critical', 'emergency_stop', action.robotId) };
    }
    case 'RESUME': {
      const robots = state.robots.map(r => r.id === action.robotId && r.status === 'error' ? { ...r, status: 'idle' as const } : r);
      return { ...state, robots, logs: addLog(state.logs, `Robot ${action.robotId} resumed`, action.robotId) };
    }
    case 'CREATE_TASK': return { ...state, tasks: [...state.tasks, action.task], logs: addLog(state.logs, `Task ${action.task.id} created`, null, action.task.sourceZone, 'task') };
    case 'CANCEL_TASK': {
      let { robots, racks, tasks, logs } = state;
      const task = tasks.find(t => t.id === action.taskId);
      if (!task) return state;
      tasks = tasks.map(t => t.id === action.taskId ? { ...t, status: 'cancelled' as const, completedAt: Date.now() } : t);
      if (task.assignedRobotId) robots = robots.map(r => r.id === task.assignedRobotId ? { ...r, status: 'idle' as const, currentTaskId: null, path: [], pathIndex: 0 } : r);
      racks = racks.map(r => r.reservedByTaskId === action.taskId ? { ...r, reserved: false, reservedByTaskId: null } : r);
      return { ...state, robots, tasks, racks, logs: addLog(logs, `Task ${action.taskId} cancelled`, task.assignedRobotId, null, 'task') };
    }
    case 'ASSIGN_TASK': {
      let { robots, racks, tasks, logs } = state;
      const task = tasks.find(t => t.id === action.taskId);
      const robot = robots.find(r => r.id === action.robotId);
      if (!task || !robot || robot.status !== 'idle' || robot.currentTaskId) return state;
      const srcRack = racks.find(r => r.id === task.sourceRack);
      if (!srcRack) return state;
      const path = computePath(robot.position, srcRack.position);
      robots = robots.map(r => r.id === action.robotId ? { ...r, status: 'moving' as const, currentTaskId: action.taskId, path, pathIndex: 0 } : r);
      tasks = tasks.map(t => t.id === action.taskId ? { ...t, status: 'assigned' as const, assignedRobotId: action.robotId, startedAt: Date.now() } : t);
      racks = racks.map(r => r.id === task.sourceRack || r.id === task.destRack ? { ...r, reserved: true, reservedByTaskId: action.taskId } : r);
      logs = addLog(logs, `Task ${action.taskId} assigned to ${action.robotId}`, action.robotId, task.sourceZone, 'task');
      return { ...state, robots, tasks, racks, logs };
    }
    case 'TICK': {
      let { robots, tasks, racks, alerts, logs, settings, tickCount } = state;
      robots = robots.map(r => ({ ...r }));
      tasks = tasks.map(t => ({ ...t }));
      racks = racks.map(r => ({ ...r, slots: { ...r.slots } }));

      // Auto-assign pending tasks to idle robots
      for (const task of tasks) {
        if (task.status !== 'pending') continue;
        const idle = robots.find(r => r.status === 'idle' && !r.currentTaskId && r.connectionState === 'online' && r.battery > 20);
        if (idle) {
          const srcRack = racks.find(r => r.id === task.sourceRack);
          if (srcRack) {
            const path = computePath(idle.position, srcRack.position);
            idle.status = 'moving';
            idle.currentTaskId = task.id;
            idle.path = path;
            idle.pathIndex = 0;
            task.status = 'assigned';
            task.assignedRobotId = idle.id;
            task.startedAt = Date.now();
            const sr = racks.find(r => r.id === task.sourceRack);
            const dr = racks.find(r => r.id === task.destRack);
            if (sr) { sr.reserved = true; sr.reservedByTaskId = task.id; }
            if (dr) { dr.reserved = true; dr.reservedByTaskId = task.id; }
            logs = addLog(logs, `Auto-assigned ${task.id} to ${idle.id}`, idle.id, task.sourceZone, 'task');
          }
        }
      }

      // Move robots
      for (const robot of robots) {
        if (robot.connectionState === 'offline' || robot.status === 'error') continue;

        // Charging
        if (robot.status === 'charging') {
          robot.battery = Math.min(100, robot.battery + 0.3 * settings.simulationSpeed);
          if (robot.battery >= 95) {
            robot.status = 'idle';
            robot.zone = 'Charging';
            logs = addLog(logs, `${robot.id} fully charged`, robot.id, null, 'charging');
          }
          continue;
        }

        // Low battery auto-charge
        if (robot.battery < 15 && robot.status === 'idle' && !robot.currentTaskId) {
          const cs = { x: WAREHOUSE.chargingStation.x + 60, y: WAREHOUSE.chargingStation.y + 30 };
          robot.path = computePath(robot.position, cs);
          robot.pathIndex = 0;
          robot.status = 'moving';
          robot.zone = 'Charging';
          alerts = addAlert(alerts, `${robot.id} battery low (${Math.round(robot.battery)}%), auto-charging`, 'warning', 'low_battery', robot.id);
          logs = addLog(logs, `${robot.id} heading to charging station`, robot.id, null, 'charging');
        }

        // Wait ticks (loading/unloading delay)
        if (robot.waitTicks > 0) {
          robot.waitTicks -= settings.simulationSpeed;
          continue;
        }

        // Move along path
        if (robot.path.length > 0 && robot.pathIndex < robot.path.length) {
          const target = robot.path[robot.pathIndex];
          robot.heading = headingTo(robot.position, target);
          robot.position = moveToward(robot.position, target, robot.speed * settings.simulationSpeed);
          robot.battery = Math.max(0, robot.battery - 0.02 * settings.simulationSpeed);
          robot.lastUpdated = Date.now();

          if (dist(robot.position, target) < 1) {
            robot.pathIndex++;
            if (robot.pathIndex >= robot.path.length) {
              // Arrived at destination
              robot.path = [];
              robot.pathIndex = 0;

              // Check if heading to charging
              if (!robot.currentTaskId && robot.battery < 20) {
                robot.status = 'charging';
                logs = addLog(logs, `${robot.id} started charging`, robot.id, null, 'charging');
                continue;
              }

              const task = tasks.find(t => t.id === robot.currentTaskId);
              if (task) {
                if (task.status === 'assigned' || task.status === 'active') {
                  // Arrived at source rack - start loading
                  robot.status = 'loading';
                  robot.waitTicks = 6;
                  task.status = 'loading';
                  logs = addLog(logs, `${robot.id} loading at ${task.sourceRack}`, robot.id, task.sourceZone, 'loading');
                } else if (task.status === 'transporting') {
                  // Arrived at destination - start unloading
                  robot.status = 'unloading';
                  robot.waitTicks = 6;
                  task.status = 'unloading';
                  logs = addLog(logs, `${robot.id} unloading at ${task.destRack}`, robot.id, task.destZone, 'unloading');
                }
              }
            }
          }
        } else if (robot.status === 'loading' && robot.waitTicks <= 0) {
          // Loading complete - pick pallet
          const task = tasks.find(t => t.id === robot.currentTaskId);
          if (task) {
            const slotKey = getSlotKey(task.sourceTier, task.sourceSlot);
            const rackIdx = racks.findIndex(r => r.id === task.sourceRack);
            if (rackIdx >= 0) {
              const pId = racks[rackIdx].slots[slotKey].palletId;
              racks[rackIdx].slots[slotKey] = { occupied: false, palletId: null };
              robot.loadStatus = 'loaded';
              robot.palletId = pId;
              task.status = 'transporting';
              // Navigate to destination
              const destRack = racks.find(r => r.id === task.destRack);
              if (destRack) {
                robot.path = computePath(robot.position, task.type === 'rack-to-checkpoint'
                  ? { x: WAREHOUSE.frontDoor.x + 70, y: WAREHOUSE.frontDoor.y + 25 }
                  : destRack.position);
                robot.pathIndex = 0;
                robot.status = 'moving';
              }
              logs = addLog(logs, `${robot.id} picked pallet from ${task.sourceRack}`, robot.id, task.sourceZone, 'pickup');
            }
          }
        } else if (robot.status === 'unloading' && robot.waitTicks <= 0) {
          // Unloading complete - place pallet
          const task = tasks.find(t => t.id === robot.currentTaskId);
          if (task) {
            const slotKey = getSlotKey(task.destTier, task.destSlot);
            const rackIdx = racks.findIndex(r => r.id === task.destRack);
            if (rackIdx >= 0) {
              racks[rackIdx].slots[slotKey] = { occupied: true, palletId: robot.palletId };
            }
            robot.loadStatus = 'empty';
            robot.palletId = null;
            robot.status = 'idle';
            robot.currentTaskId = null;
            task.status = 'completed';
            task.completedAt = Date.now();
            // Release reservations
            racks = racks.map(r => r.reservedByTaskId === task.id ? { ...r, reserved: false, reservedByTaskId: null } : r);
            logs = addLog(logs, `${robot.id} completed task ${task.id}`, robot.id, task.destZone, 'completed');
          }
        } else if (robot.status === 'idle') {
          // Determine zone based on position
          for (const z of WAREHOUSE.zones) {
            if (robot.position.x >= z.x && robot.position.x <= z.x + z.w && robot.position.y >= z.y && robot.position.y <= z.y + z.h) {
              robot.zone = z.id; break;
            }
          }
        }
      }

      // Random alerts
      if (settings.enableAlerts && tickCount % 40 === 0 && Math.random() > 0.6) {
        const types = ['obstacle_detected', 'sensor_fault', 'path_blocked', 'task_timeout'];
        const t = types[Math.floor(Math.random() * types.length)];
        const r = robots[Math.floor(Math.random() * robots.length)];
        alerts = addAlert(alerts, `${t.replace(/_/g, ' ')} on ${r.id}`, Math.random() > 0.5 ? 'warning' : 'info', t, r.id);
      }

      // Auto-generate new tasks occasionally
      if (tickCount % 60 === 0 && tasks.filter(t => t.status === 'pending').length < 2) {
        const occupied = racks.flatMap(r => {
          const s: { rack: typeof r; tier: 'top' | 'bottom'; slot: 'left' | 'right'; key: SlotKey }[] = [];
          (['topLeft', 'topRight', 'bottomLeft', 'bottomRight'] as SlotKey[]).forEach(k => {
            if (r.slots[k].occupied && !r.reserved) {
              const tier = k.startsWith('top') ? 'top' as const : 'bottom' as const;
              const slot = k.endsWith('Left') ? 'left' as const : 'right' as const;
              s.push({ rack: r, tier, slot, key: k });
            }
          });
          return s;
        });
        const empty = racks.flatMap(r => {
          const s: { rack: typeof r; tier: 'top' | 'bottom'; slot: 'left' | 'right'; key: SlotKey }[] = [];
          (['topLeft', 'topRight', 'bottomLeft', 'bottomRight'] as SlotKey[]).forEach(k => {
            if (!r.slots[k].occupied && !r.reserved) {
              const tier = k.startsWith('top') ? 'top' as const : 'bottom' as const;
              const slot = k.endsWith('Left') ? 'left' as const : 'right' as const;
              s.push({ rack: r, tier, slot, key: k });
            }
          });
          return s;
        });
        if (occupied.length > 0 && empty.length > 0) {
          const si = Math.floor(Math.random() * occupied.length);
          const di = Math.floor(Math.random() * empty.length);
          const src = occupied[si]; const dst = empty[di];
          tasks = [...tasks, {
            id: `T-${String(taskId++).padStart(3, '0')}`,
            assignedRobotId: null, type: Math.random() > 0.3 ? 'rack-to-rack' : 'rack-to-checkpoint',
            sourceZone: src.rack.zone, sourceRack: src.rack.id, sourceTier: src.tier, sourceSlot: src.slot,
            destZone: dst.rack.zone, destRack: dst.rack.id, destTier: dst.tier, destSlot: dst.slot,
            priority: (['low', 'medium', 'high'] as const)[Math.floor(Math.random() * 3)],
            createdAt: Date.now(), startedAt: null, completedAt: null, status: 'pending',
            palletId: src.rack.slots[src.key].palletId,
          }];
          logs = addLog(logs, `New task T-${String(taskId - 1).padStart(3, '0')} generated`, null, src.rack.zone, 'task');
        }
      }

      return { ...state, robots, tasks, racks, alerts, logs, tickCount: tickCount + 1 };
    }
    default: return state;
  }
}

function initialState(): SimState {
  const racks = generateRacks();
  return {
    robots: generateRobots(),
    tasks: generateInitialTasks(racks),
    racks,
    alerts: [],
    logs: [{ id: 'L-0', timestamp: Date.now(), eventType: 'system', robotId: null, userId: null, zone: null, description: 'System initialized' }],
    settings: defaultSettings,
    tickCount: 0,
    selectedRobotId: null,
    selectedRackId: null,
  };
}

interface SimCtx {
  state: SimState;
  dispatch: React.Dispatch<Action>;
  assignTask: (taskId: string, robotId: string) => void;
  cancelTask: (taskId: string) => void;
  ackAlert: (alertId: string) => void;
  selectRobot: (id: string | null) => void;
  selectRack: (id: string | null) => void;
  estop: (robotId: string) => void;
  resumeRobot: (robotId: string) => void;
  updateSettings: (s: Partial<SimSettings>) => void;
  resetDemo: () => void;
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'startedAt' | 'completedAt' | 'status' | 'assignedRobotId'>) => void;
}

const SimulationContext = createContext<SimCtx>(null!);

export const useSimulation = () => useContext(SimulationContext);

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, initialState);
  const intervalRef = useRef<number>();

  useEffect(() => {
    intervalRef.current = window.setInterval(() => dispatch({ type: 'TICK' }), 500);
    return () => clearInterval(intervalRef.current);
  }, []);

  const ctx: SimCtx = {
    state, dispatch,
    assignTask: (taskId, robotId) => dispatch({ type: 'ASSIGN_TASK', taskId, robotId }),
    cancelTask: (taskId) => dispatch({ type: 'CANCEL_TASK', taskId }),
    ackAlert: (alertId) => dispatch({ type: 'ACK_ALERT', alertId }),
    selectRobot: (id) => dispatch({ type: 'SELECT_ROBOT', robotId: id }),
    selectRack: (id) => dispatch({ type: 'SELECT_RACK', rackId: id }),
    estop: (robotId) => dispatch({ type: 'ESTOP', robotId }),
    resumeRobot: (robotId) => dispatch({ type: 'RESUME', robotId }),
    updateSettings: (s) => dispatch({ type: 'SET_SETTINGS', payload: s }),
    resetDemo: () => dispatch({ type: 'RESET' }),
    createTask: (t) => dispatch({ type: 'CREATE_TASK', task: { ...t, id: `T-${String(taskId++).padStart(3, '0')}`, createdAt: Date.now(), startedAt: null, completedAt: null, status: 'pending' as const, assignedRobotId: null } }),
  };

  return <SimulationContext.Provider value={ctx}>{children}</SimulationContext.Provider>;
}
