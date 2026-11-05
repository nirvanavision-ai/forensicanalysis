/**
 * Reads the text of a .docx file on this device. A .docx is a ZIP archive; this finds
 * word/document.xml, inflates it with the browser's DecompressionStream and keeps the text.
 */
function u16(b: Uint8Array, o: number) {
  return b[o] | (b[o + 1] << 8);
}
function u32(b: Uint8Array, o: number) {
  return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('deflate-raw');
  const out = new Blob([data as BlobPart]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

async function readEntry(buf: Uint8Array, name: string): Promise<Uint8Array | null> {
  // Find the end-of-central-directory record.
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (u32(buf, i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return null;
  const count = u16(buf, eocd + 10);
  let p = u32(buf, eocd + 16);
  const dec = new TextDecoder();
  for (let n = 0; n < count; n++) {
    if (u32(buf, p) !== 0x02014b50) return null;
    const method = u16(buf, p + 10);
    const csize = u32(buf, p + 20);
    const nameLen = u16(buf, p + 28);
    const extraLen = u16(buf, p + 30);
    const commentLen = u16(buf, p + 32);
    const local = u32(buf, p + 42);
    const entryName = dec.decode(buf.subarray(p + 46, p + 46 + nameLen));
    if (entryName === name) {
      const lNameLen = u16(buf, local + 26);
      const lExtraLen = u16(buf, local + 28);
      const start = local + 30 + lNameLen + lExtraLen;
      const data = buf.subarray(start, start + csize);
      if (method === 0) return data;
      if (method === 8) return inflateRaw(data);
      return null;
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  return null;
}

export async function docxToText(file: File): Promise<string> {
  const buf = new Uint8Array(await file.arrayBuffer());
  const xml = await readEntry(buf, 'word/document.xml');
  if (!xml) throw new Error('This file does not look like a Word document.');
  const doc = new DOMParser().parseFromString(new TextDecoder().decode(xml), 'application/xml');
  const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const paras = Array.from(doc.getElementsByTagNameNS(W, 'p'));
  return paras
    .map((p) => {
      let s = '';
      p.querySelectorAll('*').forEach((el) => {
        if (el.namespaceURI !== W) return;
        if (el.localName === 't') s += el.textContent ?? '';
        else if (el.localName === 'tab') s += '\t';
        else if (el.localName === 'br') s += '\n';
      });
      return s;
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
