// Imagens mínimas com metadados, para testar a remoção de EXIF/textos.
// JPEG mínimo: SOI, APP0 (JFIF), APP1 (EXIF falso), SOS + dados, EOI
export const JPEG_COM_EXIF = Buffer.from([
  0xff, 0xd8,
  0xff, 0xe0, 0x00, 0x06, 0x4a, 0x46, 0x49, 0x46,
  0xff, 0xe1, 0x00, 0x08, 0x45, 0x78, 0x69, 0x66, 0x47, 0x50,
  0xff, 0xda, 0x00, 0x02, 0x11, 0x22, 0xff, 0xd9,
]);

function chunkPng(tipo, dados = Buffer.alloc(0)) {
  const t = Buffer.alloc(4);
  t.writeUInt32BE(dados.length);
  return Buffer.concat([t, Buffer.from(tipo, 'latin1'), dados, Buffer.alloc(4)]);
}
export const PNG_COM_TEXTO = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunkPng('IHDR', Buffer.alloc(13)),
  chunkPng('tEXt', Buffer.from('Author\0Fulano')),
  chunkPng('IDAT', Buffer.from([1, 2, 3])),
  chunkPng('IEND'),
]);

