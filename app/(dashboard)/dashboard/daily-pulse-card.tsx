"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Sun, CloudSun, Moon, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

const QUOTES = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Your work is going to fill a large part of your life, and the only way to be truly satisfied is to do what you believe is great work.", author: "Steve Jobs" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.", author: "Stephen King" },
  { text: "Quality means doing it right when no one is looking.", author: "Henry Ford" },
];

export default function DailyPulseCard({ userName }: { userName: string }) {
  const [greeting, setGreeting] = useState("");
  const [quote, setQuote] = useState(QUOTES[0]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");

    // Select a quote based on the day of the year for "Daily" consistency
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    setQuote(QUOTES[dayOfYear % QUOTES.length]);
  }, []);

  if (!mounted) return <div className="h-40 w-full animate-pulse bg-muted rounded-2xl" />;

  const Icon = greeting === "Good Morning" ? Sun : greeting === "Good Afternoon" ? CloudSun : Moon;

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-8 shadow-sm transition-all hover:shadow-md group">
      <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-primary/5 blur-3xl transition-all group-hover:bg-primary/10" />
      
      <div className="flex flex-col h-full justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <Icon className="h-5 w-5 animate-in zoom-in-50 duration-500" />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">{greeting}</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground leading-none">
            {userName.split(" ")[0]}!
          </h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pt-1">
            {format(new Date(), "EEEE, MMMM do")}
          </p>
        </div>

        <div className="relative space-y-2">
          <Quote className="absolute -left-4 -top-3 h-6 w-6 text-primary/10" />
          <p className="text-sm font-medium leading-relaxed text-foreground/80 italic line-clamp-2 pl-2">
            "{quote.text}"
          </p>
          <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest pl-2">
            — {quote.author}
          </p>
        </div>
      </div>
    </div>
  );
}
