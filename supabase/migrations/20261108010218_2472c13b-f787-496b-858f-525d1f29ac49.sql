CREATE TABLE public.audit_log_warga (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  actor_user_id uuid,
  actor_email text,
  action text NOT NULL,
  warga_id uuid,
  warga_nik text,
  warga_nama text,
  perubahan jsonb NOT NULL DEFAULT '{}'::jsonb
);

GRANT SELECT ON public.audit_log_warga TO authenticated;
GRANT ALL ON public.audit_log_warga TO service_role;

ALTER TABLE public.audit_log_warga ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pengurus RT membaca audit warga"
ON public.audit_log_warga
FOR SELECT
TO authenticated
USING (private.is_pengurus_rt());

CREATE TRIGGER update_audit_log_warga_updated_at
BEFORE UPDATE ON public.audit_log_warga
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX audit_log_warga_created_at_idx
ON public.audit_log_warga (created_at DESC);

CREATE INDEX audit_log_warga_warga_id_idx
ON public.audit_log_warga (warga_id);

CREATE OR REPLACE FUNCTION public.catat_audit_warga()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  old_row jsonb;
  new_row jsonb;
  changes jsonb := '{}'::jsonb;
  field_name text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    new_row := to_jsonb(NEW) - 'id' - 'created_at' - 'updated_at';
    SELECT COALESCE(
      jsonb_object_agg(key, jsonb_build_object('menjadi', value)),
      '{}'::jsonb
    )
    INTO changes
    FROM jsonb_each(new_row);

    INSERT INTO public.audit_log_warga (
      actor_user_id, actor_email, action, warga_id, warga_nik, warga_nama, perubahan
    ) VALUES (
      auth.uid(), auth.jwt() ->> 'email', 'TAMBAH', NEW.id, NEW.nik, NEW.nama_lengkap, changes
    );
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    old_row := to_jsonb(OLD) - 'id' - 'created_at' - 'updated_at';
    new_row := to_jsonb(NEW) - 'id' - 'created_at' - 'updated_at';

    FOR field_name IN
      SELECT jsonb_object_keys(new_row)
    LOOP
      IF old_row -> field_name IS DISTINCT FROM new_row -> field_name THEN
        changes := changes || jsonb_build_object(
          field_name,
          jsonb_build_object(
            'dari', old_row -> field_name,
            'menjadi', new_row -> field_name
          )
        );
      END IF;
    END LOOP;

    IF changes <> '{}'::jsonb THEN
      INSERT INTO public.audit_log_warga (
        actor_user_id, actor_email, action, warga_id, warga_nik, warga_nama, perubahan
      ) VALUES (
        auth.uid(), auth.jwt() ->> 'email', 'EDIT', NEW.id, NEW.nik, NEW.nama_lengkap, changes
      );
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    old_row := to_jsonb(OLD) - 'id' - 'created_at' - 'updated_at';
    SELECT COALESCE(
      jsonb_object_agg(key, jsonb_build_object('dari', value)),
      '{}'::jsonb
    )
    INTO changes
    FROM jsonb_each(old_row);

    INSERT INTO public.audit_log_warga (
      actor_user_id, actor_email, action, warga_id, warga_nik, warga_nama, perubahan
    ) VALUES (
      auth.uid(), auth.jwt() ->> 'email', 'HAPUS', OLD.id, OLD.nik, OLD.nama_lengkap, changes
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.catat_audit_warga() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.catat_audit_warga() FROM anon;
REVOKE ALL ON FUNCTION public.catat_audit_warga() FROM authenticated;

CREATE TRIGGER audit_warga_setelah_tambah
AFTER INSERT ON public.data_warga
FOR EACH ROW
EXECUTE FUNCTION public.catat_audit_warga();

CREATE TRIGGER audit_warga_setelah_edit
AFTER UPDATE ON public.data_warga
FOR EACH ROW
EXECUTE FUNCTION public.catat_audit_warga();

CREATE TRIGGER audit_warga_setelah_hapus
AFTER DELETE ON public.data_warga
FOR EACH ROW
EXECUTE FUNCTION public.catat_audit_warga();