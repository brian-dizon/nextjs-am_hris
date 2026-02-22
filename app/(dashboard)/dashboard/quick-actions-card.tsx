"use client";

export default function QuickActionsCard() {
  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-semibold text-lg">Quick Actions</h2>
        <div className="mt-4 flex flex-col gap-2">
          <button className="w-full rounded-lg bg-muted px-4 py-2 text-left text-sm font-medium text-foreground transition-all hover:bg-muted/80">
            Update Profile
          </button>
        </div>
      </div>
    </>
  );
}
