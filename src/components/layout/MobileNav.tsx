"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardCheck, Zap, Calendar, Shield } from "lucide-react";

export default function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "學生戰鬥", href: "/", icon: Home },
    { label: "作業登記", href: "/admin/homework", icon: ClipboardCheck },
    { label: "週考結算", href: "/admin/settle", icon: Zap },
    { label: "週次管理", href: "/admin/weeks", icon: Calendar },
    { label: "後台登入", href: "/admin/login", icon: Shield },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-cyber-darkest/95 backdrop-blur-lg border-t border-cyber-border px-2 py-2 flex items-center justify-around shadow-2xl">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-md transition-all relative ${
              isActive ? "text-cyber-cyan font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-wider">{item.label}</span>
            {isActive && (
              <span className="absolute bottom-0 w-6 h-0.5 bg-cyber-cyan shadow-neon-cyan" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
