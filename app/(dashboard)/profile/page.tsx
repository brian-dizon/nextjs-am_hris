"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "@/lib/actions/profile-actions";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase, 
  Wallet, 
  Clock,
  Cake,
  ShieldHalf,
  UserCircle,
  CalendarPlus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";
import { useState } from "react";
import ApplyLeaveModal from "../leave/components/apply-leave-modal";
import { LeaveType } from "@/lib/generated/prisma"; // Import LeaveType

export default function ProfilePage() {
  const { data: session } = useSession();
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getUserProfile(),
  });

  const formatDate = (date: Date | null) => {
    if (!date) return "Not recorded";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
        <div className="h-40 w-full bg-muted rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <div className="grid grid-cols-3 gap-4 h-32 bg-muted rounded-2xl" />
            <div className="grid grid-cols-2 gap-6 h-64 bg-muted rounded-2xl" />
          </div>
          <div className="h-96 bg-muted rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      {/* Header Profile Card */}
      <section className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-10 shadow-sm transition-all hover:shadow-md">
        <div className="absolute -right-4 -top-4 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex h-28 w-24 items-center justify-center rounded-[1.5rem] bg-primary text-primary-foreground text-5xl font-bold tracking-tighter">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-center md:text-left space-y-2">
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground capitalize leading-none">{profile.name}</h1>
              <p className="text-xl text-primary/80 font-semibold tracking-tight">{profile.position || "Staff Member"}</p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 pt-2 text-sm font-medium text-muted-foreground">
                <span className="flex items-center gap-2"><Mail className="h-4 w-4 opacity-70" /> {profile.email}</span>
                <span className="flex items-center gap-2"><ShieldHalf className="h-4 w-4 opacity-70" /> {profile.role}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button 
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 active:scale-95"
              onClick={() => setIsLeaveModalOpen(true)}
            >
              <CalendarPlus className="h-4 w-4" />
              Leave Application
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Main Content Area */}
        <div className="md:col-span-2 space-y-10">
          
          {/* Leave Credits Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground px-1">Leave Credits</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { type: "VACATION", icon: CalendarPlus, color: "text-blue-500", bg: "bg-blue-100" },
                { type: "SICK", icon: ShieldHalf, color: "text-amber-500", bg: "bg-amber-100" },
                { type: "EARNED", icon: Clock, color: "text-emerald-500", bg: "bg-emerald-100" },
              ].map((leaveType) => {
                const balance = profile.leaveBalances.find(b => b.type === leaveType.type);
                return (
                  <div key={leaveType.type} className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/30">
                    <div className="flex items-center justify-between mb-4">
                      <div className={cn("p-2 rounded-lg", leaveType.bg, leaveType.color)}>
                        <leaveType.icon className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{leaveType.type}</span>
                    </div>
                    <p className="text-3xl font-bold text-foreground tracking-tighter">{balance?.balance.toFixed(1) || "0.0"}</p>
                    <p className="text-sm font-medium text-muted-foreground capitalize mt-1">Days Remaining</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Personal Information Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground px-1">Personal Record</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ProfileDetailCard 
                icon={<Phone className="h-4 w-4" />} 
                label="Phone Number" 
                value={profile.phoneNumber} 
              />
              <ProfileDetailCard 
                icon={<Cake className="h-4 w-4" />} 
                label="Date of Birth" 
                value={formatDate(profile.dateOfBirth)} 
              />
              <div className="sm:col-span-2">
                <ProfileDetailCard 
                  icon={<MapPin className="h-4 w-4" />} 
                  label="Registered Address" 
                  value={profile.address} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Section */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground px-1">Employment</h3>
          <div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm space-y-8">
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">Reports To</p>
                <div className="flex items-center gap-3 group cursor-default">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    {profile.manager?.name.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground capitalize leading-none">{profile.manager?.name || "Unassigned"}</span>
                    <span className="text-[10px] text-muted-foreground mt-1">{profile.manager?.email || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div className="h-px bg-border/50 w-full" />

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">Official Details</p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-1">Date Hired</span>
                      <span className="text-sm font-semibold text-foreground">{formatDate(profile.dateHired)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-1">Standard Day</span>
                      <span className="text-sm font-semibold text-foreground">{profile.regularWorkHours} Hours</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ApplyLeaveModal 
        isOpen={isLeaveModalOpen} 
        onClose={() => setIsLeaveModalOpen(false)} 
      />
    </div>
  );
}

function ProfileDetailCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | null }) {
  const isNotRecorded = !value || value === "Not recorded";
  
  return (
    <div className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/20 text-left">
      <div className="flex items-center gap-2 text-muted-foreground mb-3 opacity-70 group-hover:opacity-100 transition-opacity">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      <p className={cn(
        "font-sans",
        isNotRecorded 
          ? "text-[14px] leading-[23px] italic font-normal text-[#64748b]" 
          : "text-sm font-semibold leading-relaxed text-foreground"
      )}>
        {value || "Not recorded"}
      </p>
    </div>
  );
}
