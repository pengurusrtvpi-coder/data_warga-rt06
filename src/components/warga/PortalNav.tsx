import { Link, useNavigate } from '@tanstack/react-router';
import { Users, Wallet, FileText, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { BrandMark } from './BrandMark';
import { getPortalMenu, signOutWarga, type AccessRole } from '@/lib/warga';

export function PortalNav({role}:{role:AccessRole}) {
  const navigate=useNavigate();
  const queryClient=useQueryClient();
  const icons={'/keluarga':Users,'/keuangan':Wallet,'/surat':FileText};
  return <header className="no-print border-b bg-card"><div className="mx-auto max-w-6xl px-4 py-3 sm:px-6"><div className="flex items-center justify-between gap-3"><BrandMark compact/><Button variant="outline" size="sm" onClick={async()=>{await queryClient.cancelQueries();queryClient.clear();await signOutWarga();navigate({to:'/login',replace:true});}}><LogOut/>Logout</Button></div><nav aria-label="Menu portal" className="mt-3 flex flex-wrap gap-2">{getPortalMenu(role).map(({to,label})=>{const Icon=icons[to];return <Button key={to} variant="ghost" size="sm" asChild><Link to={to} activeProps={{className:'bg-primary-soft text-primary-deep'}}><Icon/>{label}</Link></Button>;})}</nav></div></header>;
}