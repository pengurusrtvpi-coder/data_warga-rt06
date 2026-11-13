import { createFileRoute, redirect, Outlet, Link } from '@tanstack/react-router';
import { hasActiveSession, getMyAccessRole } from '@/lib/warga';
import { PortalNav } from '@/components/warga/PortalNav';
import { Button } from '@/components/ui/button';

export const Route=createFileRoute('/keuangan')({
 ssr:false,
 beforeLoad:async()=>{if(!await hasActiveSession())throw redirect({to:'/login',replace:true});return {accessRole:await getMyAccessRole()};},
 component:KeuanganLayout,
});

function KeuanganLayout() {
 const {accessRole}=Route.useRouteContext();
 return <div className="min-h-screen bg-background"><PortalNav role={accessRole}/><nav className="no-print mx-auto mt-5 flex max-w-6xl flex-wrap gap-2 px-4 sm:px-6" aria-label="Laporan keuangan"><Button variant="outline" asChild><Link to="/keuangan" activeOptions={{exact:true}} activeProps={{className:'bg-primary-soft'}}>Dashboard & Tahunan</Link></Button><Button variant="outline" asChild><Link to="/keuangan/bulanan" activeProps={{className:'bg-primary-soft'}}>Laporan Bulanan</Link></Button></nav><Outlet/></div>;
}