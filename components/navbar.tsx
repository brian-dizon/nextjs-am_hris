"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Clock, 
  CalendarDays, 
  Users, 
  UserCircle, 
  LogOut, 
  CheckSquare, 
  DollarSign,
  ChevronDown,
  ShieldCheck,
  Activity,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut, useSession } from "@/lib/auth-client";
import { useState } from "react";
import { ModeToggle } from "./mode-toggle";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userRole = session?.user?.role;
  const isAdminOrLeader = userRole === "ADMIN" || userRole === "LEADER";
  const isAdmin = userRole === "ADMIN";

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Timesheet", href: "/timesheet", icon: Clock },
    { name: "Profile", href: "/profile", icon: UserCircle },
  ];

  const adminItems = [
    { name: "Approvals", href: "/approvals", icon: CheckSquare, show: isAdminOrLeader },
    { name: "Payroll", href: "/payroll", icon: DollarSign, show: isAdmin },
    { name: "Directory", href: "/directory", icon: Users, show: isAdminOrLeader },
    { name: "Activity Feed", href: "/admin/activity", icon: Activity, show: isAdmin },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Mobile Menu Button */}
        <div className="flex md:hidden mr-2">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-all hover:bg-muted active:scale-95"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Logo Section */}
        <div className="flex items-center gap-2 group cursor-default">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground font-black text-background text-lg tracking-tighter transition-all group-hover:bg-primary group-hover:text-primary-foreground">
            Am
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-xl font-black tracking-tighter text-foreground">HRIS</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-50">Pulse</span>
          </div>
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

          {/* Admin Dropdown */}
          {isAdminOrLeader && (
            <div className="relative ml-2">
              <button
                onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
                onBlur={() => setTimeout(() => setIsAdminMenuOpen(false), 200)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition-all duration-200",
                  isAdminMenuOpen || adminItems.some(i => pathname === i.href)
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <ShieldCheck className="h-4 w-4" />
                Admin
                <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", isAdminMenuOpen && "rotate-180")} />
              </button>

              {isAdminMenuOpen && (
                <div className="absolute left-0 mt-2 w-56 origin-top-left rounded-2xl border border-border bg-card p-2 shadow-xl ring-1 ring-black/5 focus:outline-none animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Management</div>
                  {adminItems.filter(i => i.show).map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 mb-0.5",
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
              )}
            </div>
          )}
        </div>

        {/* Action Section */}
        <div className="flex items-center gap-3">
          <ModeToggle />
          
          <button
            onClick={() => signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/login" } } })}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-destructive transition-all hover:bg-destructive/10 active:scale-95"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline text-[13px] tracking-tight">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden animate-in slide-in-from-top-4 duration-300 border-t border-border bg-background shadow-xl">
          <div className="space-y-1 p-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}

            {isAdminOrLeader && (
              <div className="pt-4 mt-4 border-t border-border">
                <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Admin Tools</div>
                {adminItems.filter(i => i.show).map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
