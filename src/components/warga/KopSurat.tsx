import type { CSSProperties } from 'react';

const headerStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '0 0 6px 0',
  color: '#000000',
};

const textStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  textAlign: 'center',
  color: '#000000',
  fontFamily: 'Arial, Helvetica, sans-serif',
  lineHeight: 1.15,
};

export function KopSurat() {
  return (
    <header
      style={{
        width: '100%',
        boxSizing: 'border-box',
        fontFamily: 'Arial, Helvetica, sans-serif',
        color: '#000000',
        marginBottom: '12px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '0 0 6px 0',
        }}
      >
        <img
          src="/logo_kota_bekasi.jpg"
          alt="Logo Kota Bekasi"
          style={{
            display: 'block',
            flexShrink: 0,
            width: '76px',
            height: '84px',
            objectFit: 'contain',
            flexShrink: 0,
          }}
        />
        <div style={textStyle}>
          <p
            style={{
              fontSize: '19px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '2.2px',
              margin: '0 0 2px 0',
            }}
          >
            PEMERINTAH KOTA BEKASI
          </p>
          <p
            style={{
              fontSize: '27px',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '2px',
              lineHeight: 1.05,
              margin: '0 0 3px 0',
            }}
          >
            RUKUN TETANGGA 06 RW 07
          </p>
          <p
            style={{
              fontSize: '13.2px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              whiteSpace: 'nowrap',
              margin: '0 0 2px 0',
            }}
          >
            KELURAHAN PADURENAN KECAMATAN MUSTIKA JAYA KOTA BEKASI 17156
          </p>
          <p
            style={{
              fontSize: '13.2px',
              fontWeight: 700,
              letterSpacing: '0.3px',
              whiteSpace: 'nowrap',
              margin: 0,
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

