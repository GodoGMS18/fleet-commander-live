import { useSimulation } from '@/context/SimulationContext';
import { Bot, Zap, AlertTriangle, ListTodo, CheckCircle, Battery, Activity, Pause, Loader } from 'lucide-react';

const statusColor: Record<string, string> = {
  active: 'text-status-active', idle: 'text-status-idle', moving: 'text-status-moving',
  charging: 'text-status-charging', error: 'text-status-error', warning: 'text-status-warning',
};

export default function Dashboard() {
  const { state } = useSimulation();
  const { robots, tasks, alerts, logs, racks } = state;
  const active = robots.filter(r => ['moving', 'loading', 'unloading'].includes(r.status)).length;
  const idle = robots.filter(r => r.status === 'idle').length;
  const charging = robots.filter(r => r.status === 'charging').length;
  const blocked = robots.filter(r => r.status === 'blocked' || r.status === 'waiting').length;
  const errored = robots.filter(r => r.status === 'error' || r.status === 'offline').length;
  const lowBat = robots.filter(r => r.battery < 20).length;
  const activeTasks = tasks.filter(t => !['completed', 'cancelled', 'failed', 'pending'].includes(t.status)).length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const activeAlerts = alerts.filter(a => !a.acknowledged).length;
  const totalSlots = racks.length * 4;
  const occupiedSlots = racks.reduce((n, r) => n + [r.slots.topLeft, r.slots.topRight, r.slots.bottomLeft, r.slots.bottomRight].filter(s => s.occupied).length, 0);

  const stats = [
    { label: 'Total Robots', value: robots.length, icon: Bot, color: 'text-primary' },
    { label: 'Active', value: active, icon: Activity, color: 'text-status-active' },
    { label: 'Idle', value: idle, icon: Pause, color: 'text-status-idle' },
    { label: 'Charging', value: charging, icon: Zap, color: 'text-status-charging' },
    { label: 'Blocked / Waiting', value: blocked, icon: Loader, color: 'text-status-warning' },
    { label: 'Error / Offline', value: errored, icon: AlertTriangle, color: 'text-status-error' },
    { label: 'Active Tasks', value: activeTasks, icon: ListTodo, color: 'text-status-moving' },
    { label: 'Completed', value: completedTasks, icon: CheckCircle, color: 'text-status-active' },
    { label: 'Low Battery', value: lowBat, icon: Battery, color: 'text-status-warning' },
    { label: 'Active Alerts', value: activeAlerts, icon: AlertTriangle, color: 'text-status-error' },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-foreground">Operations Dashboard</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center gap-1.5">
              <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
              <span className="stat-label">{s.label}</span>
            </div>
            <span className={`stat-value ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Robot utilization */}
        <div className="industrial-card">
          <div className="industrial-card-header">Robot Fleet Status</div>
          <div className="space-y-2">
            {robots.map(r => (
              <div key={r.id} className="flex items-center gap-2 text-xs">
                <span className="font-mono text-foreground w-12">{r.id}</span>
                <div className="flex-1">
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${r.battery}%`,
                      backgroundColor: r.battery > 50 ? 'hsl(var(--status-active))' : r.battery > 20 ? 'hsl(var(--status-warning))' : 'hsl(var(--status-error))'
                    }} />
                  </div>
                </div>
                <span className="text-muted-foreground tabular-nums w-8 text-right">{Math.round(r.battery)}%</span>
                <span className={`capitalize text-[10px] w-16 text-right ${statusColor[r.status] ?? 'text-muted-foreground'}`}>{r.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="industrial-card">
          <div className="industrial-card-header">Recent Activity</div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {logs.slice(0, 12).map(l => (
              <div key={l.id} className="text-[11px] flex gap-2">
                <span className="text-muted-foreground font-mono shrink-0 tabular-nums">{new Date(l.timestamp).toLocaleTimeString()}</span>
                <span className="text-foreground truncate">{l.description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Active alerts */}
        <div className="industrial-card">
          <div className="industrial-card-header">Active Alerts</div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {alerts.filter(a => !a.acknowledged).slice(0, 10).map(a => (
              <div key={a.id} className="text-[11px] flex items-start gap-2">
                <AlertTriangle className={`h-3 w-3 shrink-0 mt-0.5 ${a.severity === 'critical' ? 'text-status-error' : a.severity === 'warning' ? 'text-status-warning' : 'text-status-info'}`} />
                <span className="text-foreground truncate">{a.description}</span>
              </div>
            ))}
            {alerts.filter(a => !a.acknowledged).length === 0 && (
              <span className="text-muted-foreground text-xs">No active alerts</span>
            )}
          </div>
        </div>
      </div>

      {/* Zone & Inventory summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="industrial-card">
          <div className="industrial-card-header">Zone Summary</div>
          <div className="grid grid-cols-2 gap-2">
            {['A', 'B', 'C', 'D'].map(z => {
              const zr = racks.filter(r => r.zone === z);
              const occ = zr.reduce((n, r) => n + [r.slots.topLeft, r.slots.topRight, r.slots.bottomLeft, r.slots.bottomRight].filter(s => s.occupied).length, 0);
              const tot = zr.length * 4;
              return (
                <div key={z} className="bg-muted/30 rounded p-2">
                  <div className="text-xs font-semibold text-foreground">Zone {z}</div>
                  <div className="text-[10px] text-muted-foreground">{zr.length} racks · {occ}/{tot} slots</div>
                  <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${tot > 0 ? (occ / tot) * 100 : 0}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="industrial-card">
          <div className="industrial-card-header">Task Overview</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Pending', count: tasks.filter(t => t.status === 'pending').length, color: 'text-status-idle' },
              { label: 'In Progress', count: activeTasks, color: 'text-status-moving' },
              { label: 'Completed', count: completedTasks, color: 'text-status-active' },
            ].map(t => (
              <div key={t.label} className="bg-muted/30 rounded p-3">
                <div className={`text-2xl font-bold tabular-nums ${t.color}`}>{t.count}</div>
                <div className="text-[10px] text-muted-foreground uppercase">{t.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground">Warehouse occupancy: {occupiedSlots}/{totalSlots} slots ({totalSlots > 0 ? Math.round(occupiedSlots / totalSlots * 100) : 0}%)</div>
        </div>
      </div>
    </div>
  );
}
