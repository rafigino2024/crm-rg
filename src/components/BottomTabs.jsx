import { Link, useLocation } from "react-router-dom";
import { LayoutGrid, Activity, Mail, Settings } from "lucide-react";

const tabs = [
  { label: "Pipeline", icon: LayoutGrid, path: "/" },
  { label: "Activity", icon: Activity, path: "/activity" },
  { label: "Templates", icon: Mail, path: "/email-templates" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export default function BottomTabs() {
  const { pathname } = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex sm:hidden bg-card/95 backdrop-blur-xl border-t border-border/60"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {tabs.map(({ label, icon: Icon, path }) => {
        const active = pathname === path;
        return (
          <Link
            key={path}
            to={path}
            className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors
              ${active ? "text-primary" : "text-muted-foreground"}`}
          >
            <Icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : "stroke-2"}`} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}