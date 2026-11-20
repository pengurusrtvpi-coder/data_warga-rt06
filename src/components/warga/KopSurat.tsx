import type { CSSProperties } from 'react';

const headerStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  color: '#000000',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const textStyle: CSSProperties = {
  flex: '1 1 auto',
  minWidth: 0,
  textAlign: 'center',
  color: '#000000',
  fontFamily: 'Arial, Helvetica, sans-serif',
  lineHeight: 1.15,
};

const baseLineStyle: CSSProperties = {
  margin: '2px 0',
  color: '#000000',
  whiteSpace: 'nowrap',
};

export function KopSurat() {
  return (
    <>
      <header style={headerStyle}>
        <img
          src="/logo_kota_bekasi.jpg"
          alt="Logo Kota Bekasi"
          style={{
            display: 'block',
            flex: '0 0 auto',
            height: '76px',
            width: 'auto',
            objectFit: 'contain',
          }}
        />
        <div style={textStyle}>
          <p
            style={{
              ...baseLineStyle,
              fontSize: '15px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
            }}
          >
            PEMERINTAH KOTA BEKASI
          </p>
          <p
            style={{
              ...baseLineStyle,
              fontSize: '22px',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              lineHeight: 1.05,
            }}
          >
            RUKUN TETANGGA 06 RW 07
          </p>
          <p
            style={{
              ...baseLineStyle,
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            KELURAHAN PADURENAN KECAMATAN MUSTIKA JAYA KOTA BEKASI 17156
          </p>
          <p
            style={{
              ...baseLineStyle,
              fontSize: '11.5px',
              fontWeight: 700,
            }}
          >
            Sekretariat : Villa Padurenan Indah 2 Blok C No 5 Telp 089611492332
          </p>
        </div>
      </header>
      <div
        aria-hidden="true"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          marginTop: '2px',
          marginBottom: '16px',
          borderTop: '3px solid #000000',
          borderBottom: '1px solid #000000',
          paddingTop: '2px',
        }}
      />
    </>
  );
}

export default KopSurat;
