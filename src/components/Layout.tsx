import { Outlet } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";

interface LayoutProps {
  children?: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <>
      <Header />
      <main
        id="main-content"
        className="min-h-screen pt-16 pb-20"
        style={{ backgroundColor: "hsl(var(--surface-page, 36 33% 93%))" }}
      >
        {children ?? <Outlet />}
      </main>
      <Footer />
      {/* Mobile bottom nav — visible only below md */}
      <div className="block md:hidden">
        <MobileBottomNav />
      </div>
    </>
  );
}
