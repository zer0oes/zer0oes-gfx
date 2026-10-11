// Port verbatim de createZip (public/widget-export.js, retiré à la bascule
// Phase 4) : construit une archive ZIP minimale (méthode "stored", pas de
// compression) entièrement en mémoire, sans dépendance externe.

const encoder = new TextEncoder();

export function createZip(files: Record<string, string>): Uint8Array {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let localOffset = 0;
  const { time, date } = dosDateTime(new Date());

  for (const [name, content] of Object.entries(files)) {
    const nameBytes = encoder.encode(name);
    const contentBytes = encoder.encode(content);
    const checksum = crc32(contentBytes);
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);
    writeLocalHeader(localView, { time, date, checksum, size: contentBytes.length, nameLength: nameBytes.length });
    localHeader.set(nameBytes, 30);
    localParts.push(localHeader, contentBytes);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    writeCentralHeader(centralView, {
      time,
      date,
      checksum,
      size: contentBytes.length,
      nameLength: nameBytes.length,
      localOffset
    });
    centralHeader.set(nameBytes, 46);
    centralParts.push(centralHeader);
    localOffset += localHeader.length + contentBytes.length;
  }

  const centralSize = centralParts.reduce((total, part) => total + part.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, centralParts.length, true);
  endView.setUint16(10, centralParts.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, localOffset, true);

  return concatBytes([...localParts, ...centralParts, end]);
}

interface EntryHeaderValues {
  time: number;
  date: number;
  checksum: number;
  size: number;
  nameLength: number;
}

function writeLocalHeader(view: DataView, values: EntryHeaderValues): void {
  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 0x0800, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, values.time, true);
  view.setUint16(12, values.date, true);
  view.setUint32(14, values.checksum, true);
  view.setUint32(18, values.size, true);
  view.setUint32(22, values.size, true);
  view.setUint16(26, values.nameLength, true);
}

function writeCentralHeader(view: DataView, values: EntryHeaderValues & { localOffset: number }): void {
  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 20, true);
  view.setUint16(8, 0x0800, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, values.time, true);
  view.setUint16(14, values.date, true);
  view.setUint32(16, values.checksum, true);
  view.setUint32(20, values.size, true);
  view.setUint32(24, values.size, true);
  view.setUint16(28, values.nameLength, true);
  view.setUint32(42, values.localOffset, true);
}

function dosDateTime(value: Date): { time: number; date: number } {
  const year = Math.max(1980, value.getFullYear());
  return {
    time: (value.getHours() << 11) | (value.getMinutes() << 5) | Math.floor(value.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((value.getMonth() + 1) << 5) | value.getDate()
  };
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const output = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}
