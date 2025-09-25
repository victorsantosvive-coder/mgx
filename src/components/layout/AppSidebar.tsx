import { useState } from "react";
import { Home, FileText, Settings, Package, Users, Wrench, Calendar, BarChart3, ClipboardList, LogOut, ShoppingCart } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger, useSidebar, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
const mainItems = [{
  title: "Dashboard",
  url: "/",
  icon: Home
}, {
  title: "Ordens de Serviço",
  url: "/ordens-servico",
  icon: ClipboardList
}, {
  title: "Equipamentos",
  url: "/equipamentos",
  icon: Settings
}, {
  title: "Peças",
  url: "/pecas",
  icon: Package
}, {
  title: "Manutentores",
  url: "/manutentores",
  icon: Users
}, {
  title: "Solicitações de Compras",
  url: "/solicitacoes-compras",
  icon: ShoppingCart
}, {
  title: "Agenda",
  url: "/agenda",
  icon: Calendar
}];
const reportItems = [{
  title: "Relatórios",
  url: "/relatorios",
  icon: BarChart3
}, {
  title: "Histórico",
  url: "/historico",
  icon: FileText
}];
export function AppSidebar() {
  const {
    state
  } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";
  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({
    isActive
  }: {
    isActive: boolean;
  }) => isActive ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted/50";
  return <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
            <Wrench className="h-4 w-4 text-primary-foreground" />
          </div>
          {!isCollapsed && <div>
              <h1 className="text-lg font-bold">MaintenanceOS</h1>
              <p className="text-xs text-muted-foreground">Sistema de Manutenção</p>
            </div>}
        </div>
      </SidebarHeader>

      <SidebarContent className="rounded-sm bg-slate-50">
        <SidebarGroup className="bg-slate-50">
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span className="text-slate-950">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Análises</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {reportItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span className="text-slate-950">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Button variant="ghost" className="w-full justify-start">
                <LogOut className="h-4 w-4" />
                {!isCollapsed && <span>Sair</span>}
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>;
}