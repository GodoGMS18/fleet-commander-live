import { useEffect, useState } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/context/AuthContext';
import { useSimulation } from '@/context/SimulationContext';
import { Bell, Wifi, LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function AppHeader() {
  const { user, logout } = useAuth();
  const { state } = useSimulation();
  const [time, setTime] = useState(new Date());
  const unackAlerts = state.alerts.filter(a => !a.acknowledged).length;

  useEffect(() => {
    const i = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <header className="h-12 flex items-center justify-between border-b border-border px-3 bg-card shrink-0">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-status-active animate-pulse-glow" />
          <span className="text-sm font-semibold tracking-wide text-foreground">FLEET CONTROL</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs tabular-nums text-muted-foreground font-mono">
          {time.toLocaleTimeString()}
        </span>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Wifi className="h-3.5 w-3.5 text-status-active" />
          <span className="text-[10px] uppercase">Online</span>
        </div>
        <div className="relative">
          <Bell className="h-4 w-4 text-muted-foreground" />
          {unackAlerts > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {unackAlerts > 9 ? '9+' : unackAlerts}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 border-l border-border pl-3">
          <span className="text-xs text-muted-foreground">{user?.name}</span>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0">{user?.role}</Badge>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={logout}>
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
