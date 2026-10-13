import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export default function PageShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="page-shell">
      <SiteHeader />
      <main id="main-content" className="page-main">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
