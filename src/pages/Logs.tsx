import { useSimulation } from '@/context/SimulationContext';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search, ScrollText } from 'lucide-react';

export default function Logs() {
  const { state } = useSimulation();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const types = [...new Set(state.logs.map(l => l.eventType))];
  const filtered = state.logs
    .filter(l => (filterType === 'all' || l.eventType === filterType) && (search === '' || l.description.toLowerCase().includes(search.toLowerCase()) || l.robotId?.toLowerCase().includes(search.toLowerCase())))
    .slice(0, 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Activity Logs</h1>
        <div className="flex gap-2">
          <div className="flex gap-1 flex-wrap">
            <button onClick={() => setFilterType('all')} className={`text-[10px] px-2 py-1 rounded border ${filterType === 'all' ? 'bg-primary/20 border-primary/40 text-primary' : 'border-border text-muted-foreground'}`}>All</button>
            {types.slice(0, 8).map(t => (
              <button key={t} onClick={() => setFilterType(t)} className={`text-[10px] px-2 py-1 rounded border capitalize ${filterType === t ? 'bg-primary/20 border-primary/40 text-primary' : 'border-border text-muted-foreground'}`}>{t}</button>
            ))}
          </div>
          <div className="relative w-40">
            <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" className="pl-7 h-8 text-xs bg-background" />
          </div>
        </div>
      </div>
      <div className="industrial-card p-0 overflow-hidden">
        <div className="max-h-[calc(100vh-10rem)] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/30 sticky top-0">
              <tr>
                <th className="text-left px-3 py-2 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Time</th>
                <th className="text-left px-3 py-2 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Type</th>
                <th className="text-left px-3 py-2 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Robot</th>
                <th className="text-left px-3 py-2 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Zone</th>
                <th className="text-left px-3 py-2 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Description</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => (
                <tr key={log.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-3 py-1.5 font-mono tabular-nums text-muted-foreground whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString()}</td>
                  <td className="px-3 py-1.5 capitalize text-muted-foreground">{log.eventType}</td>
                  <td className="px-3 py-1.5 font-mono text-foreground">{log.robotId || '—'}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{log.zone || '—'}</td>
                  <td className="px-3 py-1.5 text-foreground">{log.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center text-muted-foreground text-sm py-8">No logs found</div>}
        </div>
      </div>
    </div>
  );
}
