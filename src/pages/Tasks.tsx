import { useSimulation } from '@/context/SimulationContext';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ListTodo, X } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-status-idle', assigned: 'text-status-info', active: 'text-status-moving',
  loading: 'text-status-active', transporting: 'text-status-moving', unloading: 'text-status-warning',
  completed: 'text-status-active', cancelled: 'text-muted-foreground', failed: 'text-status-error',
};

const PRIO_COLORS: Record<string, string> = {
  low: 'bg-status-idle/10 text-status-idle border-status-idle/30',
  medium: 'bg-status-info/10 text-status-info border-status-info/30',
  high: 'bg-status-warning/10 text-status-warning border-status-warning/30',
  urgent: 'bg-status-error/10 text-status-error border-status-error/30',
};

export default function Tasks() {
  const { state, assignTask, cancelTask } = useSimulation();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = state.tasks.filter(t => filterStatus === 'all' || t.status === filterStatus).sort((a, b) => b.createdAt - a.createdAt);
  const detail = state.tasks.find(t => t.id === selectedId);
  const idleRobots = state.robots.filter(r => r.status === 'idle' && !r.currentTaskId && r.connectionState === 'online');

  return (
    <div className="flex gap-3 h-[calc(100vh-7rem)]">
      <div className="flex-1 space-y-3 overflow-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">Task Management</h1>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {['pending', 'assigned', 'active', 'loading', 'transporting', 'unloading', 'completed', 'cancelled', 'failed'].map(s => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          {filtered.map(task => (
            <div key={task.id} onClick={() => setSelectedId(task.id)} className={`industrial-card cursor-pointer hover:border-primary/30 transition-colors py-2.5 ${selectedId === task.id ? 'border-primary/50' : ''}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <ListTodo className={`h-3.5 w-3.5 ${STATUS_COLORS[task.status]}`} />
                <span className="font-mono font-bold text-xs text-foreground">{task.id}</span>
                <Badge variant="outline" className={`text-[9px] px-1 py-0 capitalize ${STATUS_COLORS[task.status]}`}>{task.status}</Badge>
                <Badge variant="outline" className={`text-[9px] px-1 py-0 capitalize ${PRIO_COLORS[task.priority]}`}>{task.priority}</Badge>
                <span className="text-[10px] text-muted-foreground capitalize ml-auto">{task.type.replace(/-/g, ' ')}</span>
              </div>
              <div className="flex items-center gap-4 mt-1 text-[10px] text-muted-foreground">
                <span>{task.sourceRack} → {task.destRack}</span>
                {task.assignedRobotId && <span className="font-mono">🤖 {task.assignedRobotId}</span>}
                <span className="ml-auto tabular-nums">{new Date(task.createdAt).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="text-center text-muted-foreground text-sm py-8">No tasks found</div>}
        </div>
      </div>

      {detail && (
        <div className="w-72 industrial-card overflow-y-auto shrink-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">Task {detail.id}</span>
            <button onClick={() => setSelectedId(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div><span className="stat-label">Status</span><div className={`font-semibold capitalize ${STATUS_COLORS[detail.status]}`}>{detail.status}</div></div>
              <div><span className="stat-label">Priority</span><div className="font-semibold capitalize">{detail.priority}</div></div>
              <div><span className="stat-label">Type</span><div className="font-semibold capitalize">{detail.type.replace(/-/g, ' ')}</div></div>
              <div><span className="stat-label">Robot</span><div className="font-mono">{detail.assignedRobotId || '—'}</div></div>
            </div>
            <div className="bg-muted/30 rounded p-2 space-y-1">
              <span className="stat-label">Source</span>
              <div className="text-foreground">{detail.sourceRack} · {detail.sourceTier}-{detail.sourceSlot}</div>
              <span className="stat-label">Destination</span>
              <div className="text-foreground">{detail.destRack} · {detail.destTier}-{detail.destSlot}</div>
            </div>
            {detail.palletId && (
              <div className="bg-muted/30 rounded p-2"><span className="stat-label">Pallet</span><div className="font-mono text-foreground">{detail.palletId}</div></div>
            )}
            <div className="grid grid-cols-1 gap-1 text-[10px] text-muted-foreground">
              <div>Created: {new Date(detail.createdAt).toLocaleString()}</div>
              {detail.startedAt && <div>Started: {new Date(detail.startedAt).toLocaleString()}</div>}
              {detail.completedAt && <div>Completed: {new Date(detail.completedAt).toLocaleString()}</div>}
            </div>
            {detail.status === 'pending' && idleRobots.length > 0 && (
              <div>
                <span className="stat-label block mb-1">Assign Robot</span>
                {idleRobots.map(r => (
                  <Button key={r.id} variant="outline" size="sm" className="mr-1 mb-1 text-[10px] h-6" onClick={() => assignTask(detail.id, r.id)}>{r.id}</Button>
                ))}
              </div>
            )}
            {!['completed', 'cancelled', 'failed'].includes(detail.status) && (
              <Button variant="destructive" size="sm" className="w-full text-[10px] h-7" onClick={() => cancelTask(detail.id)}>Cancel Task</Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
