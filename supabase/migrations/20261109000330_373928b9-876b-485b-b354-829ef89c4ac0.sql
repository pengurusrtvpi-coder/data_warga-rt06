REVOKE ALL ON public.audit_log_warga FROM anon;
REVOKE ALL ON public.audit_log_warga FROM authenticated;
GRANT SELECT ON public.audit_log_warga TO authenticated;
GRANT ALL ON public.audit_log_warga TO service_role;