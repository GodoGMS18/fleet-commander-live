import { LayoutDashboard, Map, Bot, ListTodo, Warehouse, AlertTriangle, ScrollText, Settings } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useSimulation } from '@/context/SimulationContext';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar,
} from '@/components/ui/sidebar';

const NAV = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Live Map', url: '/map', icon: Map },
  { title: 'Robots', url: '/robots', icon: Bot },
  { title: 'Tasks', url: '/tasks', icon: ListTodo },
  { title: 'Racks / Inventory', url: '/racks', icon: Warehouse },
  { title: 'Alerts', url: '/alerts', icon: AlertTriangle },
  { title: 'Activity Logs', url: '/logs', icon: ScrollText },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { state: sidebarState } = useSidebar();
  const collapsed = sidebarState === 'collapsed';
  const location = useLocation();
  const { state } = useSimulation();
  const unack = state.alerts.filter(a => !a.acknowledged).length;

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="px-3 py-3 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="text-xs font-bold tracking-wider text-foreground">WR-FMS</div>
              <div className="text-[9px] text-muted-foreground uppercase">Fleet Management</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center mx-auto">
            <Bot className="h-4 w-4 text-primary" />
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[9px]">OPERATIONS</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === '/'} className="hover:bg-accent/50 text-sidebar-foreground" activeClassName="bg-accent text-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                      {!collapsed && item.url === '/alerts' && unack > 0 && (
                        <span className="ml-auto bg-destructive text-destructive-foreground text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">{unack}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {!collapsed && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[9px]">FLEET STATUS</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-3 space-y-1.5">
                {state.robots.map(r => (
                  <div key={r.id} className="flex items-center gap-2 text-xs">
                    <div className={`status-dot ${r.status === 'idle' ? 'status-dot-idle' : r.status === 'moving' ? 'status-dot-moving' : r.status === 'charging' ? 'status-dot-charging' : r.status === 'error' || r.status === 'offline' ? 'status-dot-error' : 'status-dot-active'}`} />
                    <span className="text-sidebar-foreground font-mono text-[11px]">{r.id}</span>
                    <span className="ml-auto text-muted-foreground text-[10px]">{Math.round(r.battery)}%</span>
                  </div>
                ))}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
