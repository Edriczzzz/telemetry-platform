import { NavLink, Outlet } from "react-router-dom";
import { ConnectionStatus } from "../components/ConnectionStatus";
import { DemoBadge } from "../components/DemoBadge";
import { useHealth } from "../features/system/useHealth";

const NAV = [
  { to: "/", label: "Panel", end: true },
  { to: "/map", label: "Mapa" },
  { to: "/missions", label: "Misiones" },
  { to: "/flight", label: "Monitoreo de vuelo" },
  { to: "/detections", label: "Inventario de baches" },
  { to: "/history", label: "Historial" },
  { to: "/orthomosaics", label: "Ortomosaicos" },
  { to: "/users", label: "Usuarios" },
  { to: "/system", label: "Estado del sistema" },
];

export function Layout() {
  const { state } = useHealth();
  return (
    <div className="flex h-full flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col bg-ink text-[#d7e3e0] md:w-60">
        <div className="px-4 py-3 text-lg font-bold leading-tight">
          Inspección vial
          <span className="block text-sm font-normal opacity-75">VANT</span>
        </div>
        <nav aria-label="Principal" className="flex overflow-x-auto md:flex-col md:overflow-visible">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `whitespace-nowrap border-b-4 px-4 py-2.5 md:border-b-0 md:border-l-4 ${
                  isActive
                    ? "border-[#6db3ea] bg-ink-soft font-bold text-white"
                    : "border-transparent hover:bg-ink-soft"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-end gap-3 border-b border-line bg-white px-4 py-2.5">
          <DemoBadge />
          <ConnectionStatus state={state} />
        </header>
        <main className="flex-1 overflow-auto p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
