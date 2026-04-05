import { useSimulation } from '@/context/SimulationContext';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bot, Battery, MapPin, Package, AlertTriangle, Search, X } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  idle: 'text-status-idle', moving: 'text-status-moving', loading: 'text-status-active',
  unloading: 'text-status-warning', charging: 'text-status-charging', waiting: 'text-status-warning',
  blocked: 'text-status-error', error: 'text-status-error', offline: 'text-muted-foreground',
};

const STATUS_BG: Record<string, string> = {
  idle: 'bg-status-idle/10 border-status-idle/30', moving: 'bg-status-moving/10 border-status-moving/30',
  loading: 'bg-status-active/10 border-status-active/30', charging: 'bg-status-charging/10 border-status-charging/30',
  error: 'bg-status-error/10 border-status-error/30',
};

export default function Robots() {
  const { state, selectRobot, estop, resumeRobot } = useSimulation();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const filtered = state.robots.filter(r => r.id.toLowerCase().includes(search.toLowerCase()) || r.name.toLowerCase().includes(search.toLowerCase()));
  const detail = state.robots.find(r => r.id === selectedId);
  const detailTask = detail?.currentTaskId ? state.tasks.find(t => t.id === detail.currentTaskId) : null;
  const detailLogs = state.logs.filter(l => l.robotId === selectedId).slice(0, 15);

  return (
    <div className="flex gap-3 h-[calc(100vh-7rem)]">
      <div className="flex-1 space-y-3 overflow-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">Robot Fleet</h1>
          <div className="relative w-48">
            <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search robots…" className="pl-7 h-8 text-xs bg-background" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          {filtered.map(robot => (
            <div key={robot.id} onClick={() => setSelectedId(robot.id)} className={`industrial-card cursor-pointer hover:border-primary/30 transition-colors ${selectedId === robot.id ? 'border-primary/50' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Bot className={`h-4 w-4 ${STATUS_COLORS[robot.status]}`} />
                  <span className="font-mono font-bold text-sm text-foreground">{robot.id}</span>
                  <Badge variant="outline" className={`text-[9px] px-1 py-0 capitalize ${STATUS_BG[robot.status] || ''}`}>{robot.status}</Badge>
                </div>
                <span className="text-[10px] text-muted-foreground capitalize">{robot.type}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div><span className="text-muted-foreground block">Battery</span><span className={`font-semibold tabular-nums ${robot.battery < 20 ? 'text-status-error' : 'text-foreground'}`}>{Math.round(robot.battery)}%</span></div>
                <div><span className="text-muted-foreground block">Zone</span><span className="font-semibold text-foreground">{robot.zone}</span></div>
                <div><span className="text-muted-foreground block">Load</span><span className="font-semibold text-foreground capitalize">{robot.loadStatus}</span></div>
              </div>
              {robot.currentTaskId && (
                <div className="mt-2 text-[10px] bg-muted/30 rounded px-2 py-1 font-mono text-muted-foreground">Task: {robot.currentTaskId}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {detail && (
        <div className="w-72 industrial-card overflow-y-auto shrink-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">Robot {detail.id}</span>
            <button onClick={() => setSelectedId(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              {[
                ['Status', detail.status, STATUS_COLORS[detail.status]],
                ['Battery', `${Math.round(detail.battery)}%`],
                ['Type', detail.type],
                ['Speed', `${detail.speed} u/t`],
                ['Zone', detail.zone],
                ['Load', detail.loadStatus],
                ['Position', `${Math.round(detail.position.x)}, ${Math.round(detail.position.y)}`],
                ['Connection', detail.connectionState],
              ].map(([label, val, color]) => (
                <div key={label as string}><span className="stat-label">{label}</span><div className={`font-semibold capitalize ${color || ''}`}>{val}</div></div>
              ))}
            </div>
            {detailTask && (
              <div className="bg-muted/30 rounded p-2">
                <span className="stat-label">Current Task</span>
                <div className="text-foreground font-mono">{detailTask.id}</div>
                <div className="text-muted-foreground mt-1">{detailTask.sourceRack} → {detailTask.destRack}</div>
                <div className="capitalize text-muted-foreground">{detailTask.status}</div>
              </div>
            )}
            {detail.palletId && (
              <div className="bg-muted/30 rounded p-2 flex items-center gap-2">
                <Package className="h-3 w-3 text-primary" />
                <span className="text-foreground font-mono">{detail.palletId}</span>
              </div>
            )}
            <div className="flex gap-2">
              {detail.status !== 'error' ? (
                <Button variant="destructive" size="sm" className="flex-1 text-[10px] h-7" onClick={() => estop(detail.id)}>E-STOP</Button>
              ) : (
                <Button variant="outline" size="sm" className="flex-1 text-[10px] h-7" onClick={() => resumeRobot(detail.id)}>RESUME</Button>
              )}
            </div>
            <div>
              <span className="stat-label block mb-1">Recent Logs</span>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {detailLogs.map(l => (
                  <div key={l.id} className="text-[10px] text-muted-foreground">
                    <span className="font-mono tabular-nums">{new Date(l.timestamp).toLocaleTimeString()}</span> {l.description}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
