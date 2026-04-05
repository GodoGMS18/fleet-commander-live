import { useSimulation } from '@/context/SimulationContext';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Warehouse, Search, X } from 'lucide-react';

export default function Racks() {
  const { state } = useSimulation();
  const [search, setSearch] = useState('');
  const [filterZone, setFilterZone] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = state.racks.filter(r => (filterZone === 'all' || r.zone === filterZone) && r.id.toLowerCase().includes(search.toLowerCase()));
  const detail = state.racks.find(r => r.id === selectedId);
  const recentLogs = detail ? state.logs.filter(l => l.description.includes(detail.id)).slice(0, 10) : [];

  return (
    <div className="flex gap-3 h-[calc(100vh-7rem)]">
      <div className="flex-1 space-y-3 overflow-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">Racks / Inventory</h1>
          <div className="flex gap-2">
            <div className="flex gap-1">
              {['all', 'A', 'B', 'C', 'D'].map(z => (
                <button key={z} onClick={() => setFilterZone(z)} className={`text-[10px] px-2 py-1 rounded border ${filterZone === z ? 'bg-primary/20 border-primary/40 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>
                  {z === 'all' ? 'All' : `Zone ${z}`}
                </button>
              ))}
            </div>
            <div className="relative w-36">
              <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" className="pl-7 h-8 text-xs bg-background" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
          {filtered.map(rack => {
            const occ = [rack.slots.topLeft, rack.slots.topRight, rack.slots.bottomLeft, rack.slots.bottomRight].filter(s => s.occupied).length;
            return (
              <div key={rack.id} onClick={() => setSelectedId(rack.id)} className={`industrial-card cursor-pointer hover:border-primary/30 transition-colors py-2 ${selectedId === rack.id ? 'border-primary/50' : ''}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono font-bold text-xs text-foreground">{rack.id}</span>
                  {rack.reserved && <Badge variant="outline" className="text-[8px] px-1 py-0 text-status-warning border-status-warning/30">RSV</Badge>}
                </div>
                <div className="grid grid-cols-2 gap-0.5">
                  {[rack.slots.topLeft, rack.slots.topRight, rack.slots.bottomLeft, rack.slots.bottomRight].map((s, i) => (
                    <div key={i} className={`h-4 rounded-sm ${s.occupied ? 'bg-primary/30 border border-primary/40' : 'bg-muted/40 border border-border'}`} />
                  ))}
                </div>
                <div className="text-[9px] text-muted-foreground mt-1 text-center">{occ}/4 occupied</div>
              </div>
            );
          })}
        </div>
      </div>

      {detail && (
        <div className="w-72 industrial-card overflow-y-auto shrink-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">Rack {detail.id}</span>
            <button onClick={() => setSelectedId(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div><span className="stat-label">Zone</span><div className="font-semibold">{detail.zone}</div></div>
              <div><span className="stat-label">Reserved</span><div className="font-semibold">{detail.reserved ? 'Yes' : 'No'}</div></div>
            </div>
            <div>
              <span className="stat-label block mb-1">Pallet Slots</span>
              <div className="grid grid-cols-2 gap-1">
                {([['topLeft', 'Top Left'], ['topRight', 'Top Right'], ['bottomLeft', 'Bottom Left'], ['bottomRight', 'Bottom Right']] as const).map(([key, label]) => (
                  <div key={key} className={`p-2 rounded text-center ${detail.slots[key].occupied ? 'bg-primary/10 border border-primary/30' : 'bg-muted/30 border border-border'}`}>
                    <div className="text-[9px] text-muted-foreground">{label}</div>
                    <div className={`text-[10px] font-semibold ${detail.slots[key].occupied ? 'text-primary' : 'text-muted-foreground'}`}>
                      {detail.slots[key].occupied ? detail.slots[key].palletId?.slice(-8) : 'Empty'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {detail.reservedByTaskId && (
              <div className="bg-muted/30 rounded p-2">
                <span className="stat-label">Reserved by</span>
                <div className="font-mono text-foreground">{detail.reservedByTaskId}</div>
              </div>
            )}
            <div>
              <span className="stat-label block mb-1">Recent Activity</span>
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {recentLogs.length > 0 ? recentLogs.map(l => (
                  <div key={l.id} className="text-[10px] text-muted-foreground">
                    <span className="font-mono tabular-nums">{new Date(l.timestamp).toLocaleTimeString()}</span> {l.description}
                  </div>
                )) : <span className="text-muted-foreground text-[10px]">No recent activity</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
