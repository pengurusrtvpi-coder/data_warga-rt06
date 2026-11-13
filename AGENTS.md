<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- All data access and auth calls for the resident portal live in `src/lib/warga.ts`; pages and components only call its functions. Why: the backend is the user's own external Supabase, so swapping/wiring the client touches one file.
- Protected portal pages use client-only `beforeLoad` guards and shared role helpers: `/keluarga` is the existing admin/resident home, while bendahara lands on `/keuangan` and cannot enter resident/letter pages. Why: preserve the external-Supabase URLs while making login, navigation, and guards agree.
- Finance UI and mutations share `canManageFinance`; bendahara enters payer names without fetching resident records. Why: finance CRUD must not grant access to private resident biodata.
- Form validation lives in `validateWargaForm` and `validateAdminWargaForm` (zod) in `src/lib/warga.ts` and mirrors data_warga NOT NULL columns and DB enums. Why: one place to update when the table changes.
- Pengurus RT = row in `public.user_roles` with role `admin`, enforced by `private.is_pengurus_rt()` (security definer, non-API schema). The browser reads only its own role row through RLS; never trust `user_metadata` or the entered email for roles or KK. Why: users can edit metadata and credentials are not proof of a role.
- Locked data_warga columns are enforced for residents by the `lindungi_kolom_data_warga` BEFORE UPDATE trigger (raises 42501 with an Indonesian message); the resident form omits them, while the admin form includes every resident-data column. Why: RLS cannot restrict individual columns, but the trigger explicitly exempts pengurus RT.
- Finance and letter data calls remain in the shared warga data layer, with paginated reads and TanStack Query loaders; new protected pages use the existing client-only session/role guard convention. Why: preserve the external-Supabase architecture and avoid truncated reports.
- Finance writes use the protected role table and database policies; letter inserts normalize biodata in a database trigger and residents only read/submit household letters. Why: UI controls alone cannot protect direct requests or private biodata.
- Printable reports and letters use scoped print CSS and browser printing, with original letter timestamps retained. Why: PDF output must exclude portal controls and preserve issued documents.
