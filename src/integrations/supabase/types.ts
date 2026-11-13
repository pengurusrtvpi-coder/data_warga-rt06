export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_log_warga: {
        Row: {
          action: string
          actor_email: string | null
          actor_user_id: string | null
          created_at: string
          id: string
          perubahan: Json
          updated_at: string
          warga_id: string | null
          warga_nama: string | null
          warga_nik: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_user_id?: string | null
          created_at?: string
          id?: string
          perubahan?: Json
          updated_at?: string
          warga_id?: string | null
          warga_nama?: string | null
          warga_nik?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_user_id?: string | null
          created_at?: string
          id?: string
          perubahan?: Json
          updated_at?: string
          warga_id?: string | null
          warga_nama?: string | null
          warga_nik?: string | null
        }
        Relationships: []
      }
      data_warga: {
        Row: {
          agama: string
          alamat: string
          catatan: string | null
          created_at: string
          email: string | null
          foto_ktp_url: string | null
          golongan_darah: string | null
          id: string
          jenis_kelamin: string
          kewarganegaraan: string
          nama_lengkap: string
          nik: string
          no_hp: string | null
          no_kk: string
          pekerjaan: string | null
          pendidikan_terakhir: string | null
          rt: string
          rw: string
          status_hub_keluarga: string
          status_perkawinan: string
          status_warga: string
          tanggal_lahir: string
          tempat_lahir: string
          updated_at: string
        }
        Insert: {
          agama: string
          alamat: string
          catatan?: string | null
          created_at?: string
          email?: string | null
          foto_ktp_url?: string | null
          golongan_darah?: string | null
          id?: string
          jenis_kelamin: string
          kewarganegaraan?: string
          nama_lengkap: string
          nik: string
          no_hp?: string | null
          no_kk: string
          pekerjaan?: string | null
          pendidikan_terakhir?: string | null
          rt: string
          rw: string
          status_hub_keluarga: string
          status_perkawinan: string
          status_warga?: string
          tanggal_lahir: string
          tempat_lahir: string
          updated_at?: string
        }
        Update: {
          agama?: string
          alamat?: string
          catatan?: string | null
          created_at?: string
          email?: string | null
          foto_ktp_url?: string | null
          golongan_darah?: string | null
          id?: string
          jenis_kelamin?: string
          kewarganegaraan?: string
          nama_lengkap?: string
          nik?: string
          no_hp?: string | null
          no_kk?: string
          pekerjaan?: string | null
          pendidikan_terakhir?: string | null
          rt?: string
          rw?: string
          status_hub_keluarga?: string
          status_perkawinan?: string
          status_warga?: string
          tanggal_lahir?: string
          tempat_lahir?: string
          updated_at?: string
        }
        Relationships: []
      }
      papan_pengumuman: {
        Row: {
          created_at: string | null
          dibuat_oleh: string | null
          id: number
          isi_pengumuman: string
          judul: string
          status: string | null
          tanggal_berakhir: string | null
          tanggal_tampil: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dibuat_oleh?: string | null
          id?: number
          isi_pengumuman: string
          judul: string
          status?: string | null
          tanggal_berakhir?: string | null
          tanggal_tampil?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dibuat_oleh?: string | null
          id?: number
          isi_pengumuman?: string
          judul?: string
          status?: string | null
          tanggal_berakhir?: string | null
          tanggal_tampil?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pelayanan_surat: {
        Row: {
          agama: string | null
          alamat: string | null
          created_at: string | null
          email_pembuat: string | null
          id: string
          jenis_kelamin: string | null
          jenis_surat: string
          keperluan: string
          nama_pemohon: string
          nik: string
          nomor_surat: string | null
          pekerjaan: string | null
          tempat_tgl_lahir: string | null
        }
        Insert: {
          agama?: string | null
          alamat?: string | null
          created_at?: string | null
          email_pembuat?: string | null
          id?: string
          jenis_kelamin?: string | null
          jenis_surat: string
          keperluan: string
          nama_pemohon: string
          nik: string
          nomor_surat?: string | null
          pekerjaan?: string | null
          tempat_tgl_lahir?: string | null
        }
        Update: {
          agama?: string | null
          alamat?: string | null
          created_at?: string | null
          email_pembuat?: string | null
          id?: string
          jenis_kelamin?: string | null
          jenis_surat?: string
          keperluan?: string
          nama_pemohon?: string
          nik?: string
          nomor_surat?: string | null
          pekerjaan?: string | null
          tempat_tgl_lahir?: string | null
        }
        Relationships: []
      }
      running_text: {
        Row: {
          id: number
          pesan: string
          status: string | null
        }
        Insert: {
          id?: never
          pesan?: string
          status?: string | null
        }
        Update: {
          id?: never
          pesan?: string
          status?: string | null
        }
        Relationships: []
      }
      transaksi_keuangan: {
        Row: {
          created_at: string | null
          id: string
          jenis: string
          jumlah: number
          kategori: string
          keterangan: string | null
          nama_warga: string | null
          tanggal: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          jenis: string
          jumlah: number
          kategori: string
          keterangan?: string | null
          nama_warga?: string | null
          tanggal?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          jenis?: string
          jumlah?: number
          kategori?: string
          keterangan?: string | null
          nama_warga?: string | null
          tanggal?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          fcm_token: string | null
          role: string
          user_id: string
        }
        Insert: {
          fcm_token?: string | null
          role: string
          user_id: string
        }
        Update: {
          fcm_token?: string | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      view_laporan_keuangan_bulanan: {
        Row: {
          bulan_angka: number | null
          bulan_tahun: string | null
          surplus_defisit: number | null
          tahun_angka: number | null
          total_pemasukan: number | null
          total_pengeluaran: number | null
        }
        Relationships: []
      }
      view_statistik_usia_dukcapil: {
        Row: {
          kategori_usia: string | null
          laki_laki: number | null
          perempuan: number | null
          persentase: string | null
          total_warga: number | null
        }
        Relationships: []
      }
      view_statistik_usia_produktif: {
        Row: {
          kategori_produktif: string | null
          laki_laki: number | null
          perempuan: number | null
          persentase: string | null
          total_warga: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_my_keluarga: {
        Args: never
        Returns: {
          agama: string
          alamat: string
          catatan: string | null
          created_at: string
          email: string | null
          foto_ktp_url: string | null
          golongan_darah: string | null
          id: string
          jenis_kelamin: string
          kewarganegaraan: string
          nama_lengkap: string
          nik: string
          no_hp: string | null
          no_kk: string
          pekerjaan: string | null
          pendidikan_terakhir: string | null
          rt: string
          rw: string
          status_hub_keluarga: string
          status_perkawinan: string
          status_warga: string
          tanggal_lahir: string
          tempat_lahir: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "data_warga"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_my_kk: { Args: never; Returns: string }
      get_my_no_kk: { Args: never; Returns: string }
      get_warga_by_kk: {
        Args: { target_no_kk: string }
        Returns: {
          agama: string
          alamat: string
          catatan: string | null
          created_at: string
          email: string | null
          foto_ktp_url: string | null
          golongan_darah: string | null
          id: string
          jenis_kelamin: string
          kewarganegaraan: string
          nama_lengkap: string
          nik: string
          no_hp: string | null
          no_kk: string
          pekerjaan: string | null
          pendidikan_terakhir: string | null
          rt: string
          rw: string
          status_hub_keluarga: string
          status_perkawinan: string
          status_warga: string
          tanggal_lahir: string
          tempat_lahir: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "data_warga"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      is_admin: { Args: never; Returns: boolean }
      is_bendahara: { Args: never; Returns: boolean }
    }
    Enums: {
      agama_enum:
        | "Islam"
        | "Kristen"
        | "Katolik"
        | "Hindu"
        | "Buddha"
        | "Khonghucu"
        | "Lainnya"
      golongan_darah_enum:
        | "A"
        | "B"
        | "AB"
        | "O"
        | "A+"
        | "A-"
        | "B+"
        | "B-"
        | "AB+"
        | "AB-"
        | "O+"
        | "O-"
        | "Tidak Tahu"
      jenis_kelamin_enum: "Laki-laki" | "Perempuan"
      status_perkawinan_enum:
        | "Belum Kawin"
        | "Kawin"
        | "Cerai Hidup"
        | "Cerai Mati"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      agama_enum: [
        "Islam",
        "Kristen",
        "Katolik",
        "Hindu",
        "Buddha",
        "Khonghucu",
        "Lainnya",
      ],
      golongan_darah_enum: [
        "A",
        "B",
        "AB",
        "O",
        "A+",
        "A-",
        "B+",
        "B-",
        "AB+",
        "AB-",
        "O+",
        "O-",
        "Tidak Tahu",
      ],
      jenis_kelamin_enum: ["Laki-laki", "Perempuan"],
      status_perkawinan_enum: [
        "Belum Kawin",
        "Kawin",
        "Cerai Hidup",
        "Cerai Mati",
      ],
    },
  },
} as const
