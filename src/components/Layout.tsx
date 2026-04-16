import { Outlet } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

interface LayoutProps {
  children?: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen">
        {children ?? <Outlet />}
      </main>
      <Footer />
    </>
  );
}
