import { useSimulation } from '@/context/SimulationContext';
import { WAREHOUSE } from '@/mock/warehouse';
import { Robot, Rack } from '@/types';
import { useState, useMemo } from 'react';
import { X, Zap, MapPin, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STATUS_COLORS: Record<string, string> = {
  idle: '#6b7280', moving: '#22d3ee', loading: '#34d399', unloading: '#fbbf24',
  charging: '#a78bfa', waiting: '#f59e0b', blocked: '#ef4444', error: '#ef4444', offline: '#4b5563',
};

const ZONE_FILL: Record<string, string> = { A: '#0f2a4a', B: '#0a3a2a', C: '#2a1f0a', D: '#1a0f2a' };

export default function LiveMap() {
  const { state, selectRobot, selectRack, estop, resumeRobot } = useSimulation();
  const { robots, racks, tasks, settings, selectedRobotId, selectedRackId } = state;
  const [zoom, setZoom] = useState(1);

  const selectedRobot = robots.find(r => r.id === selectedRobotId);
  const selectedRack = racks.find(r => r.id === selectedRackId);
  const activeTasks = tasks.filter(t => t.assignedRobotId && !['completed', 'cancelled', 'failed'].includes(t.status));

  return (
    <div className="flex gap-3 h-[calc(100vh-7rem)]">
      {/* Map */}
      <div className="flex-1 industrial-card p-1 overflow-hidden relative">
        <div className="absolute top-2 left-2 z-10 flex gap-1">
          <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => setZoom(z => Math.min(z + 0.2, 3))}>+</Button>
          <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}>−</Button>
          <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => setZoom(1)}>1:1</Button>
        </div>
        <svg
          viewBox={`0 0 ${WAREHOUSE.width} ${WAREHOUSE.height}`}
          className="w-full h-full"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
        >
          {/* Background */}
          <rect x={0} y={0} width={WAREHOUSE.width} height={WAREHOUSE.height} fill="#0a0f1a" />

          {/* Grid */}
          {settings.showGrid && (
            <g opacity={0.08}>
              {Array.from({ length: 25 }, (_, i) => <line key={`gv${i}`} x1={i * 50} y1={0} x2={i * 50} y2={WAREHOUSE.height} stroke="#fff" strokeWidth={0.5} />)}
              {Array.from({ length: 17 }, (_, i) => <line key={`gh${i}`} x1={0} y1={i * 50} x2={WAREHOUSE.width} y2={i * 50} stroke="#fff" strokeWidth={0.5} />)}
            </g>
          )}

          {/* Warehouse boundary */}
          <rect {...WAREHOUSE.boundary} width={WAREHOUSE.boundary.w} height={WAREHOUSE.boundary.h} fill="none" stroke="#334155" strokeWidth={2} rx={4} />

          {/* Main aisles */}
          <line x1={30} y1={WAREHOUSE.mainAisleY} x2={1170} y2={WAREHOUSE.mainAisleY} stroke="#1e293b" strokeWidth={20} />
          <line x1={510} y1={30} x2={510} y2={770} stroke="#1e293b" strokeWidth={16} />

          {/* Zones */}
          {WAREHOUSE.zones.map(z => (
            <g key={z.id}>
              <rect x={z.x} y={z.y} width={z.w} height={z.h} fill={ZONE_FILL[z.id]} stroke="#1e3a5f" strokeWidth={1} rx={3} opacity={0.6} />
              {settings.showLabels && (
                <text x={z.x + 8} y={z.y + 14} fill="#64748b" fontSize={9} fontWeight="bold" fontFamily="monospace">{z.label}</text>
              )}
            </g>
          ))}

          {/* Front door */}
          <rect {...WAREHOUSE.frontDoor} width={WAREHOUSE.frontDoor.w} height={WAREHOUSE.frontDoor.h} fill="#1a3a2a" stroke="#22c55e" strokeWidth={1.5} rx={2} />
          <text x={WAREHOUSE.frontDoor.x + 20} y={WAREHOUSE.frontDoor.y + 18} fill="#22c55e" fontSize={8} fontFamily="monospace" fontWeight="bold">FRONT DOOR</text>

          {/* Loading area */}
          <rect {...WAREHOUSE.loadingArea} width={WAREHOUSE.loadingArea.w} height={WAREHOUSE.loadingArea.h} fill="#1a2a3a" stroke="#3b82f6" strokeWidth={1} rx={2} strokeDasharray="4 2" />
          <text x={WAREHOUSE.loadingArea.x + 90} y={WAREHOUSE.loadingArea.y + 18} fill="#3b82f6" fontSize={7} fontFamily="monospace">LOADING / UNLOADING</text>

          {/* Charging station */}
          <rect {...WAREHOUSE.chargingStation} width={WAREHOUSE.chargingStation.w} height={WAREHOUSE.chargingStation.h} fill="#1a1a2e" stroke="#a78bfa" strokeWidth={1.5} rx={2} />
          <text x={WAREHOUSE.chargingStation.x + 14} y={WAREHOUSE.chargingStation.y + 20} fill="#a78bfa" fontSize={7} fontFamily="monospace" fontWeight="bold">⚡ CHARGING</text>

          {/* Racks */}
          {racks.map(rack => {
            const isSelected = rack.id === selectedRackId;
            const isReserved = rack.reserved;
            const occ = [rack.slots.topLeft, rack.slots.topRight, rack.slots.bottomLeft, rack.slots.bottomRight].filter(s => s.occupied).length;
            return (
              <g key={rack.id} className="cursor-pointer" onClick={() => selectRack(rack.id)}>
                <rect x={rack.position.x - 22} y={rack.position.y - 12} width={44} height={24} fill={isSelected ? '#1e40af' : '#1a2332'} stroke={isSelected ? '#60a5fa' : isReserved ? '#f59e0b' : '#334155'} strokeWidth={isSelected ? 2 : 1} rx={2} />
                {/* Slot indicators */}
                {[
                  { s: rack.slots.topLeft, dx: -14, dy: -6 },
                  { s: rack.slots.topRight, dx: 4, dy: -6 },
                  { s: rack.slots.bottomLeft, dx: -14, dy: 4 },
                  { s: rack.slots.bottomRight, dx: 4, dy: 4 },
                ].map((slot, i) => (
                  <rect key={i} x={rack.position.x + slot.dx} y={rack.position.y + slot.dy} width={10} height={6} fill={slot.s.occupied ? '#22d3ee' : '#0f172a'} stroke="#334155" strokeWidth={0.5} rx={1} opacity={0.8} />
                ))}
                {settings.showLabels && (
                  <text x={rack.position.x} y={rack.position.y + 22} fill="#64748b" fontSize={6} fontFamily="monospace" textAnchor="middle">{rack.id}</text>
                )}
              </g>
            );
          })}

          {/* Task paths */}
          {settings.showPaths && activeTasks.map(task => {
            const robot = robots.find(r => r.id === task.assignedRobotId);
            if (!robot || robot.path.length === 0) return null;
            const pathPoints = [robot.position, ...robot.path.slice(robot.pathIndex)];
            const d = pathPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
            return <path key={task.id} d={d} fill="none" stroke="#22d3ee" strokeWidth={1.5} strokeDasharray="6 3" opacity={0.5} />;
          })}

          {/* Robots */}
          {robots.map(robot => {
            const isSelected = robot.id === selectedRobotId;
            const color = STATUS_COLORS[robot.status] || '#6b7280';
            return (
              <g key={robot.id} className="cursor-pointer" onClick={() => selectRobot(robot.id)}>
                <g transform={`translate(${robot.position.x},${robot.position.y})`}>
                  {isSelected && <circle r={16} fill="none" stroke={color} strokeWidth={1.5} opacity={0.5} />}
                  <g transform={`rotate(${robot.heading})`}>
                    <polygon points="0,-8 6,6 -6,6" fill={color} stroke={isSelected ? '#fff' : color} strokeWidth={isSelected ? 1.5 : 0.5} />
                  </g>
                  {robot.loadStatus === 'loaded' && (
                    <rect x={-3} y={-3} width={6} height={6} fill="#fbbf24" rx={1} opacity={0.9} />
                  )}
                  {settings.showLabels && (
                    <text x={0} y={-12} fill={color} fontSize={7} fontFamily="monospace" fontWeight="bold" textAnchor="middle">{robot.id}</text>
                  )}
                  {/* Battery indicator */}
                  <rect x={-8} y={10} width={16} height={2} fill="#1e293b" rx={1} />
                  <rect x={-8} y={10} width={Math.max(0, 16 * robot.battery / 100)} height={2} fill={robot.battery > 50 ? '#22c55e' : robot.battery > 20 ? '#f59e0b' : '#ef4444'} rx={1} />
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Detail panel */}
      {(selectedRobot || selectedRack) && (
        <div className="w-72 industrial-card overflow-y-auto shrink-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              {selectedRobot ? `Robot ${selectedRobot.id}` : `Rack ${selectedRack!.id}`}
            </span>
            <button onClick={() => { selectRobot(null); selectRack(null); }} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {selectedRobot && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="stat-label">Status</span><div className="font-semibold capitalize" style={{ color: STATUS_COLORS[selectedRobot.status] }}>{selectedRobot.status}</div></div>
                <div><span className="stat-label">Battery</span><div className="font-semibold">{Math.round(selectedRobot.battery)}%</div></div>
                <div><span className="stat-label">Type</span><div className="font-semibold capitalize">{selectedRobot.type}</div></div>
                <div><span className="stat-label">Speed</span><div className="font-semibold">{selectedRobot.speed} u/t</div></div>
                <div><span className="stat-label">Zone</span><div className="font-semibold">{selectedRobot.zone}</div></div>
                <div><span className="stat-label">Load</span><div className="font-semibold capitalize">{selectedRobot.loadStatus}</div></div>
                <div><span className="stat-label">Position</span><div className="font-mono text-[10px]">{Math.round(selectedRobot.position.x)}, {Math.round(selectedRobot.position.y)}</div></div>
                <div><span className="stat-label">Connection</span><div className="font-semibold capitalize">{selectedRobot.connectionState}</div></div>
              </div>
              {selectedRobot.currentTaskId && (
                <div className="bg-muted/30 rounded p-2">
                  <span className="stat-label">Current Task</span>
                  <div className="font-mono text-foreground">{selectedRobot.currentTaskId}</div>
                </div>
              )}
              {selectedRobot.palletId && (
                <div className="bg-muted/30 rounded p-2">
                  <span className="stat-label">Carrying</span>
                  <div className="font-mono text-foreground">{selectedRobot.palletId}</div>
                </div>
              )}
              <div className="flex gap-2">
                {selectedRobot.status !== 'error' ? (
                  <Button variant="destructive" size="sm" className="flex-1 text-[10px] h-7" onClick={() => estop(selectedRobot.id)}>E-STOP</Button>
                ) : (
                  <Button variant="outline" size="sm" className="flex-1 text-[10px] h-7" onClick={() => resumeRobot(selectedRobot.id)}>RESUME</Button>
                )}
              </div>
            </div>
          )}

          {selectedRack && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="stat-label">Zone</span><div className="font-semibold">{selectedRack.zone}</div></div>
                <div><span className="stat-label">Reserved</span><div className="font-semibold">{selectedRack.reserved ? 'Yes' : 'No'}</div></div>
              </div>
              <div>
                <span className="stat-label block mb-1">Pallet Slots</span>
                <div className="grid grid-cols-2 gap-1">
                  {([['topLeft', 'Top Left'], ['topRight', 'Top Right'], ['bottomLeft', 'Bottom Left'], ['bottomRight', 'Bottom Right']] as const).map(([key, label]) => (
                    <div key={key} className={`p-2 rounded text-center ${selectedRack.slots[key].occupied ? 'bg-primary/10 border border-primary/30' : 'bg-muted/30 border border-border'}`}>
                      <div className="text-[9px] text-muted-foreground">{label}</div>
                      <div className={`text-[10px] font-semibold ${selectedRack.slots[key].occupied ? 'text-primary' : 'text-muted-foreground'}`}>
                        {selectedRack.slots[key].occupied ? selectedRack.slots[key].palletId?.slice(-6) : 'Empty'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
