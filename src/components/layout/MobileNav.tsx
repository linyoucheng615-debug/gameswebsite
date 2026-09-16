"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, User, Shield } from "lucide-react";
import { UserProfile } from "@/types";

export default function MobileNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        setUser(data.user || null);
      } catch {
        setUser(null);
      }
    }
    checkUser();
  }, [pathname]);

  const navItems = [
    { label: "首頁", href: "/", icon: Home },
    { label: "賽事", href: "/tournaments", icon: Trophy },
    { label: "個人", href: user ? "/profile" : "/login", icon: User },
    ...(user?.role === "admin"
      ? [{ label: "管理", href: "/admin/users", icon: Shield }]
      : []),
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-cyber-darkest/95 backdrop-blur-lg border-t border-cyber-border px-3 py-2 flex items-center justify-around shadow-2xl">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-md transition-all relative ${
              isActive
                ? "text-cyber-cyan font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? "text-glow-cyan" : ""}`} />
            <span className="text-[10px] font-mono tracking-wider">{item.label}</span>
            {isActive && (
              <span className="absolute bottom-0 w-6 h-0.5 bg-cyber-cyan shadow-neon-cyan" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

