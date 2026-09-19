import type { ReactNode } from "react";
import { routes } from "../router";
export function AppLayout({
  children,
  onNavigate,
  onLogout,
}: {
  children: ReactNode;
  onNavigate: (route: string) => void;
  onLogout: () => void;
}) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <h1>MiniERP</h1>
        {routes.map((route) => (
          <button key={route} onClick={() => onNavigate(route)}>
            {route}
          </button>
        ))}
        <button onClick={onLogout}>Cerrar sesión</button>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
