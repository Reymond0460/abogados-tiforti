'use strict';
/* Exportación a Excel (.xlsx) sin librerías: un .xlsx es un ZIP de archivos XML.
   Los textos se guardan como texto (nunca como fórmulas), por lo que un valor que
   empiece con "=" no se ejecuta en Excel. */
window.AdminExport = (() => {
  const enc = new TextEncoder();
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (u8) => { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };

  function zip(files) { // files: [{name, data(Uint8Array)}], sin compresión
    const parts = [], central = []; let offset = 0;
    const u16 = (v) => [v & 255, (v >>> 8) & 255], u32 = (v) => [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255];
    files.forEach((f) => {
      const name = enc.encode(f.name), crc = crc32(f.data), size = f.data.length;
      const local = new Uint8Array([0x50, 0x4B, 3, 4, ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(size), ...u32(size), ...u16(name.length), ...u16(0)]);
      parts.push(local, name, f.data);
      central.push({ name, crc, size, offset });
      offset += local.length + name.length + size;
    });
    const cdStart = offset; let cdSize = 0;
    central.forEach((c) => {
      const h = new Uint8Array([0x50, 0x4B, 1, 2, ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(c.crc), ...u32(c.size), ...u32(c.size), ...u16(c.name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(c.offset)]);
      parts.push(h, c.name); cdSize += h.length + c.name.length;
    });
    parts.push(new Uint8Array([0x50, 0x4B, 5, 6, ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(cdSize), ...u32(cdStart), ...u16(0)]));
    return new Blob(parts, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  const esc = (s) => String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const col = (i) => { let s = ''; i++; while (i) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
  const serial = (ts) => (ts - new Date(ts).getTimezoneOffset() * 60000) / 86400000 + 25569;

  /* sheet: { name, headers:[...], widths:[...], rows:[[value...]] } ; value: string | number | {date:ts} */
  function sheetXml(sh) {
    const cell = (v, r, c, header) => {
      const ref = col(c) + r;
      if (header) return `<c r="${ref}" t="inlineStr" s="1"><is><t>${esc(v)}</t></is></c>`;
      if (v && typeof v === 'object' && 'date' in v) return `<c r="${ref}" s="3"><v>${serial(v.date).toFixed(6)}</v></c>`;
      if (typeof v === 'number') return `<c r="${ref}"><v>${v}</v></c>`;
      return `<c r="${ref}" t="inlineStr" s="2"><is><t xml:space="preserve">${esc(v == null ? '' : v)}</t></is></c>`;
    };
    const head = `<row r="1" ht="24" customHeight="1">${sh.headers.map((h, i) => cell(h, 1, i, true)).join('')}</row>`;
    const body = sh.rows.map((row, ri) => `<row r="${ri + 2}">${row.map((v, ci) => cell(v, ri + 2, ci, false)).join('')}</row>`).join('');
    const last = col(sh.headers.length - 1) + (sh.rows.length + 1);
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
      + '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
      + `<cols>${sh.widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>`
      + `<sheetData>${head}${body}</sheetData><autoFilter ref="A1:${last}"/></worksheet>`;
  }

  function toXlsx(sheets) {
    const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    const files = [
      ['[Content_Types].xml', X + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
        + sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('') + '</Types>'],
      ['_rels/.rels', X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ['xl/workbook.xml', X + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'
        + sheets.map((s, i) => `<sheet name="${esc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') + '</sheets></workbook>'],
      ['xl/_rels/workbook.xml.rels', X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')
        + `<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
      ['xl/styles.xml', X + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="dd\\-mm\\-yyyy\\ hh:mm"/></numFmts>'
        + '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts>'
        + '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0E3B83"/><bgColor indexed="64"/></patternFill></fill></fills>'
        + '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFD7E0ED"/></left><right style="thin"><color rgb="FFD7E0ED"/></right><top style="thin"><color rgb="FFD7E0ED"/></top><bottom style="thin"><color rgb="FFD7E0ED"/></bottom><diagonal/></border></borders>'
        + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
        + '<cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
        + '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>'
        + '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>'
        + '<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="top"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>']
    ].concat(sheets.map((s, i) => [`xl/worksheets/sheet${i + 1}.xml`, sheetXml(s)]));
    return zip(files.map(([name, xml]) => ({ name, data: enc.encode(xml) })));
  }

  const fmtDate = (ts) => { const d = new Date(ts), p = (n) => String(n).padStart(2, '0'); return p(d.getDate()) + '-' + p(d.getMonth() + 1) + '-' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()); };
  const toTSV = (sh) => [sh.headers].concat(sh.rows.map((r) => r.map((v) => (v && typeof v === 'object' && 'date' in v ? fmtDate(v.date) : v)))).map((r) => r.map((v) => String(v == null ? '' : v).replace(/[\t\r\n]+/g, ' ')).join('\t')).join('\n');

  return { toXlsx, toTSV, crc32 };
})();
