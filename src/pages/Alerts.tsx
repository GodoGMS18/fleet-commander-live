import { useSimulation } from '@/context/SimulationContext';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';

const SEV_COLORS: Record<string, string> = {
  info: 'text-status-info', warning: 'text-status-warning', critical: 'text-status-error',
};
const SEV_BG: Record<string, string> = {
  info: 'border-status-info/30', warning: 'border-status-warning/30', critical: 'border-status-error/30',
};

export default function Alerts() {
  const { state, ackAlert } = useSimulation();
  const [filterSev, setFilterSev] = useState<string>('all');
  const [showAcked, setShowAcked] = useState(false);

  const filtered = state.alerts
    .filter(a => (filterSev === 'all' || a.severity === filterSev) && (showAcked || !a.acknowledged))
    .sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Alerts</h1>
        <div className="flex gap-2 items-center">
          <div className="flex gap-1">
            {['all', 'info', 'warning', 'critical'].map(s => (
              <button key={s} onClick={() => setFilterSev(s)} className={`text-[10px] px-2 py-1 rounded border capitalize ${filterSev === s ? 'bg-primary/20 border-primary/40 text-primary' : 'border-border text-muted-foreground'}`}>{s}</button>
            ))}
          </div>
          <label className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={showAcked} onChange={e => setShowAcked(e.target.checked)} className="rounded border-border" />
            Show acknowledged
          </label>
        </div>
      </div>
      <div className="space-y-1.5 max-h-[calc(100vh-10rem)] overflow-y-auto">
        {filtered.map(alert => (
          <div key={alert.id} className={`industrial-card py-2.5 flex items-start gap-3 ${alert.acknowledged ? 'opacity-50' : ''}`}>
            <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${SEV_COLORS[alert.severity]}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-foreground">{alert.id}</span>
                <Badge variant="outline" className={`text-[9px] px-1 py-0 capitalize ${SEV_COLORS[alert.severity]} ${SEV_BG[alert.severity]}`}>{alert.severity}</Badge>
                <span className="text-[10px] text-muted-foreground capitalize">{alert.type.replace(/_/g, ' ')}</span>
                {alert.robotId && <span className="text-[10px] font-mono text-muted-foreground">🤖 {alert.robotId}</span>}
              </div>
              <div className="text-xs text-foreground mt-0.5">{alert.description}</div>
              <div className="text-[10px] text-muted-foreground tabular-nums mt-0.5">{new Date(alert.timestamp).toLocaleString()}</div>
            </div>
            {!alert.acknowledged && (
              <Button variant="outline" size="sm" className="text-[10px] h-6 shrink-0" onClick={() => ackAlert(alert.id)}>
                <CheckCircle className="h-3 w-3 mr-1" />ACK
              </Button>
            )}
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center text-muted-foreground text-sm py-8">No alerts</div>}
      </div>
    </div>
  );
}
