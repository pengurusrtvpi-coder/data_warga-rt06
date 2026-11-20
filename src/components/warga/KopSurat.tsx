import type { CSSProperties } from 'react';

const headerStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  display: 'grid',
  gridTemplateColumns: '26mm minmax(0, 1fr) 26mm',
  alignItems: 'center',
  padding: '0 2mm 3mm',
  marginBottom: '4mm',
  color: '#000',
  fontFamily: "'Times New Roman', Times, serif",
};

const textStyle: CSSProperties = {
  minWidth: 0,
  textAlign: 'center',
  lineHeight: 1.25,
  whiteSpace: 'nowrap',
};

const linesStyle: CSSProperties = {
  margin: 0,
  overflow: 'visible',
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
            justifySelf: 'center',
            width: '22mm',
            height: '25mm',
            objectFit: 'contain',
          }}
        />
        <div style={textStyle}>
          <p style={{ ...linesStyle, fontSize: '18px', fontWeight: 'bold' }}>
            PEMERINTAH KOTA BEKASI
          </p>
          <p style={{ ...linesStyle, fontSize: '17px', fontWeight: 'bold' }}>
            RUKUN TETANGGA 06 RW 07
          </p>
          <p style={{ ...linesStyle, fontSize: '12px', fontWeight: 'bold' }}>
            KELURAHAN PADURENAN KECAMATAN MUSTIKA JAYA KOTA BEKASI 17156
          </p>
          <p style={{ ...linesStyle, fontSize: '11px' }}>
            Sekretariat : Villa Padurenan Indah 2 Blok C No 5 Telp 089611492332
          </p>
        </div>
        {/* Balancing column keeps the text block centered on the page, not between logo and edge. */}
        <div aria-hidden="true" />
      </header>
      <div
        aria-hidden="true"
        style={{
          width: '100%',
          height: '4px',
          marginBottom: '16px',
          borderTop: '3px solid #000',
          borderBottom: '1px solid #000',
          boxSizing: 'border-box',
        }}
      />
    </>
  );
}
