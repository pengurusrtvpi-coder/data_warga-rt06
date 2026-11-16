import { Link, useNavigate } from '@tanstack/react-router';
import {
  Users,
  Wallet,
  FileText,
  Award,
  BarChart3,
  MessageSquarePlus,
  Package,
  BookOpen,
  Megaphone,
  LogOut,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { BrandMark } from './BrandMark';
import { getPortalMenu, signOutWarga, type AccessRole } from '@/lib/warga';

export function PortalNav({ role }: { role: AccessRole }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const icons: Record<string, any> = {
    '/keluarga': Users,
    '/keuangan': Wallet,
    '/surat': FileText,
    '/pengurus': Award,
    '/statistik': BarChart3,
    '/aspirasi': MessageSquarePlus,
    '/inventaris': Package,
    '/jurnal': BookOpen,
    '/login': Megaphone,
  };

  const r = role as string;
  const isBendahara = r === 'bendahara';
  const isKesra = r === 'kesra_pkk';
  const isSeksi = r === 'seksi_rt';
  const isAdmin = r === 'admin';

 let menuList = isBendahara
      ? [
          { to: '/keuangan' as any, label: 'Keuangan RT' },
          { to: '/jurnal' as any, label: 'Jurnal Kegiatan' },
          { to: '/inventaris' as any, label: 'Inventaris RT' },
          { to: '/aspirasi' as any, label: 'Aspirasi Warga' },
          { to: '/statistik' as any, label: 'Statistik Usia' },
        ]    : isKesra
    ? [
        { to: '/jurnal' as any, label: 'Jurnal Kegiatan' },
        { to: '/inventaris' as any, label: 'Inventaris RT' },
        { to: '/aspirasi' as any, label: 'Aspirasi Warga' },
        { to: '/keuangan' as any, label: 'Laporan Keuangan' },
        { to: '/pengurus' as any, label: 'Struktur Pengurus' },
        { to: '/statistik' as any, label: 'Statistik Usia' },
      ]
    : isSeksi
    ? [
        { to: '/jurnal' as any, label: 'Jurnal Kegiatan' },
        { to: '/aspirasi' as any, label: 'Aspirasi Warga' },
        { to: '/inventaris' as any, label: 'Inventaris RT' },
        { to: '/keuangan' as any, label: 'Laporan Keuangan' },
        { to: '/pengurus' as any, label: 'Struktur Pengurus' },
        { to: '/statistik' as any, label: 'Statistik Usia' },
      ]
    : [...getPortalMenu(role)];

  if (!isBendahara && !isKesra && !isSeksi) {
    if (!menuList.some((item) => item.to === '/pengurus')) {
      menuList.push({ to: '/pengurus' as any, label: 'Struktur Pengurus' });
    }
    if (!menuList.some((item) => item.to === '/statistik')) {
      menuList.push({ to: '/statistik' as any, label: 'Statistik Usia' });
    }
    if (!menuList.some((item) => item.to === '/aspirasi')) {
      menuList.push({ to: '/aspirasi' as any, label: 'Aspirasi Warga' });
    }
    if (!menuList.some((item) => item.to === '/inventaris')) {
      menuList.push({ to: '/inventaris' as any, label: 'Inventaris RT' });
    }
    if (!menuList.some((item) => item.to === '/jurnal')) {
      menuList.push({ to: '/jurnal' as any, label: 'Jurnal Kegiatan' });
    }
    if (isAdmin && !menuList.some((item) => item.to === '/login')) {
      menuList.push({ to: '/login' as any, label: 'Running Text' });
    }
  }

  return (
    <header className="no-print sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <BrandMark compact />
          <button
            type="button"
            onClick={async () => {
              await queryClient.cancelQueries();
              queryClient.clear();
              await signOutWarga();
              navigate({ to: '/login', replace: true });
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 active:scale-95"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </div>

        <nav
          aria-label="Menu portal"
          className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2"
        >
          {menuList.map(({ to, label }) => {
            const Icon = icons[to] || Award;
            return (
              <Link
                key={to}
                to={to as any}
                className="group flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-2 text-xs font-semibold text-slate-700 transition-all duration-200 hover:border-sky-300 hover:bg-sky-50/80 hover:text-sky-900 active:scale-[0.98] sm:rounded-full sm:px-3.5 sm:py-2"
                activeProps={{
                  className:
                    '!border-sky-600 !bg-gradient-to-r !from-sky-600 !to-cyan-600 !text-white !font-bold shadow-sm',
                }}
              >
                <Icon className="h-4 w-4 shrink-0 text-sky-600 transition-transform duration-200 group-hover:scale-110 group-[.active]:text-white" />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
