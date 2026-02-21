import Navbar from "@/components/navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
