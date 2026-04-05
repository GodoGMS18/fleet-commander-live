import { useSimulation } from '@/context/SimulationContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/context/AuthContext';

export default function Settings() {
  const { state, updateSettings, resetDemo } = useSimulation();
  const { user } = useAuth();
  const { settings } = state;

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-lg font-bold text-foreground">Settings</h1>

      <div className="industrial-card space-y-4">
        <div className="industrial-card-header">Simulation</div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div><div className="text-sm text-foreground">Simulation Speed</div><div className="text-[10px] text-muted-foreground">Current: {settings.simulationSpeed}x</div></div>
            <div className="w-40">
              <Slider value={[settings.simulationSpeed]} min={0.5} max={5} step={0.5} onValueChange={([v]) => updateSettings({ simulationSpeed: v })} />
            </div>
          </div>
        </div>
      </div>

      <div className="industrial-card space-y-4">
        <div className="industrial-card-header">Map Display</div>
        {[
          { key: 'showGrid' as const, label: 'Show Grid', desc: 'Display background grid on map' },
          { key: 'showPaths' as const, label: 'Show Paths', desc: 'Display robot path lines' },
          { key: 'showLabels' as const, label: 'Show Labels', desc: 'Display robot and rack labels' },
        ].map(item => (
          <div key={item.key} className="flex items-center justify-between">
            <div><div className="text-sm text-foreground">{item.label}</div><div className="text-[10px] text-muted-foreground">{item.desc}</div></div>
            <Switch checked={settings[item.key]} onCheckedChange={v => updateSettings({ [item.key]: v })} />
          </div>
        ))}
      </div>

      <div className="industrial-card space-y-4">
        <div className="industrial-card-header">Alerts</div>
        <div className="flex items-center justify-between">
          <div><div className="text-sm text-foreground">Random Alerts</div><div className="text-[10px] text-muted-foreground">Generate simulated alerts</div></div>
          <Switch checked={settings.enableAlerts} onCheckedChange={v => updateSettings({ enableAlerts: v })} />
        </div>
      </div>

      {user?.role === 'admin' && (
        <div className="industrial-card space-y-4">
          <div className="industrial-card-header">Mock Users</div>
          <div className="space-y-1">
            {[
              { email: 'admin@demo.com', role: 'Admin' },
              { email: 'supervisor@demo.com', role: 'Supervisor' },
              { email: 'operator@demo.com', role: 'Operator' },
            ].map(u => (
              <div key={u.email} className="flex items-center justify-between text-xs py-1.5">
                <span className="text-foreground">{u.email}</span>
                <span className="text-muted-foreground">{u.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="industrial-card">
        <div className="industrial-card-header">Demo Control</div>
        <Button variant="destructive" size="sm" onClick={resetDemo}>Reset All Demo Data</Button>
      </div>
    </div>
  );
}
