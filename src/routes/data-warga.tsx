import { createFileRoute, redirect } from '@tanstack/react-router';
import { getMyAccessRole, getRoleHome, hasActiveSession } from '@/lib/warga';

export const Route = createFileRoute('/data-warga')({
  ssr: false,
  beforeLoad: async () => {
    if (!(await hasActiveSession())) throw redirect({ to: '/login', replace: true });
    throw redirect({ to: getRoleHome(await getMyAccessRole()), replace: true });
  },
  head: () => ({ meta: [
    { title: 'Akses Data Warga — RT 06 VPI-2' },
    { name: 'description', content: 'Akses data warga RT 06 VPI-2 sesuai peran akun.' },
    { property: 'og:title', content: 'Akses Data Warga — RT 06 VPI-2' },
    { property: 'og:description', content: 'Akses aman data keluarga dan warga RT 06 VPI-2.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'robots', content: 'noindex' },
  ] }),
});