"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Clock, CalendarDays, Users, UserCircle, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Timesheet", href: "/timesheet", icon: Clock },
  { name: "Leave", href: "/leave", icon: CalendarDays },
  { name: "Directory", href: "/directory", icon: Users },
  { name: "Profile", href: "/profile", icon: UserCircle },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo Section */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
            Am
          </div>
          <span className="text-xl font-bold tracking-tight">HRIS</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Action Section (Logout Placeholder) */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => signOut({ fetchOptions: { onSuccess: () => window.location.href = "/login" } })}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-all hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
