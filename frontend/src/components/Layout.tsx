import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-bms-grey">
      <div className="w-10 h-10 border-4 border-bms-red border-t-transparent rounded-full animate-spin" />
      {label && <p className="mt-3 text-sm">{label}</p>}
    </div>
  );
}

export function MovieRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">{children}</div>
  );
}
