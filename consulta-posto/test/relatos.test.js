import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  ocultarDadosPessoais, removerMetadadosJpeg, removerMetadadosPng, sanearTexto, validarDataAproximada, validarNovoRelato,
} from '../server/relatos/validacao.js';
import { RepositorioRelatos } from '../server/relatos/repositorio.js';
import { JPEG_COM_EXIF, PNG_COM_TEXTO } from './fixtures.js';

const hoje = new Date('2026-11-13T12:00:00Z');
const valido = {
  postoId: 'demo-001',
  dataAproximada: '2026-10',
  tipoProblema: 'qualidade',
  descricao: 'O carro começou a falhar logo depois de abastecer com gasolina comum na bomba 3.',
  aceiteTermos: true,
};

test('saneamento remove caracteres de controle e de direção', () => {
  assert.equal(sanearTexto('  olá\u0000‮mundo\n\n\n\nfim ', 100), 'olámundo\n\nfim');
});

test('dados pessoais na descrição são ocultados', () => {
  const t = ocultarDadosPessoais('Meu email é a.b@x.com, CPF 123.456.789-09, tel (11) 98765-4321, placa ABC1D23.');
  assert.ok(!/a\.b@x\.com|123\.456|98765|ABC1D23/.test(t), t);
});

test('data aproximada: aceita mês, recusa futuro e muito antigo', () => {
  assert.equal(validarDataAproximada('2026-10', hoje), '2026-10');
  assert.equal(validarDataAproximada('2026-12-01', hoje), null);
  assert.equal(validarDataAproximada('2019-01', hoje), null);
  assert.equal(validarDataAproximada('2026-13', hoje), null);
});

test('relato válido e anônimo é aceito', () => {
  const { erros, relato } = validarNovoRelato(valido, { postoExiste: () => true, hoje });
  assert.deepEqual(erros, {});
  assert.equal(relato.contato, null);
});

test('relato exige termos, consentimento de contato e de imagens', () => {
  const { erros } = validarNovoRelato(
    { ...valido, aceiteTermos: false, contato: 'pessoa@exemplo.com', anexos: [{ base64: JPEG_COM_EXIF.toString('base64') }] },
    { postoExiste: () => true, hoje },
  );
  assert.ok(erros.aceiteTermos && erros.contato && erros.anexos);
});

test('anexo que não é imagem é recusado mesmo com extensão de imagem', () => {
  const { erros } = validarNovoRelato(
    { ...valido, consentimentoImagens: true, anexos: [{ nome: 'foto.jpg', tipo: 'image/jpeg', base64: Buffer.from('<script>alert(1)</script>').toString('base64') }] },
    { postoExiste: () => true, hoje },
  );
  assert.match(erros.anexos, /JPEG ou PNG/);
});

test('EXIF do JPEG e textos do PNG são removidos', () => {
  const jpg = removerMetadadosJpeg(JPEG_COM_EXIF);
  assert.ok(!jpg.includes(Buffer.from('Exif')));
  assert.ok(jpg.includes(Buffer.from('JFIF')));
  const png = removerMetadadosPng(PNG_COM_TEXTO);
  assert.ok(!png.includes(Buffer.from('Fulano')));
  assert.ok(png.includes(Buffer.from('IDAT')));
});

test('repositório: moderação, visão pública sem dados pessoais, remoção e retenção', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'relatos-'));
  let agora = new Date('2026-01-01T00:00:00Z');
  try {
    const repo = await new RepositorioRelatos(dir, () => agora).iniciar();
    const { relato } = validarNovoRelato(
      { ...valido, descricao: `${valido.descricao} Contato: fulano@exemplo.com`, contato: 'fulano@exemplo.com', consentimentoContato: true, consentimentoImagens: true, anexos: [{ base64: JPEG_COM_EXIF.toString('base64') }] },
      { postoExiste: () => true, hoje },
    );
    const { protocolo, codigoRemocao } = await repo.criar(relato);
    assert.equal(repo.listarPublicos('demo-001').itens.length, 0, 'nada público antes da moderação');
    assert.equal(repo.listarPublicos('demo-001').aguardandoModeracao, 1);
    assert.equal((await readdir(join(dir, 'anexos'))).length, 1);

    const [pendente] = repo.listarParaModeracao().relatos;
    assert.equal(pendente.codigoRemocaoHash, undefined);
    await repo.decidir(pendente.id, 'publicar');
    const [publico] = repo.listarPublicos('demo-001').itens;
    assert.equal(publico.verificado, false);
    assert.ok(!JSON.stringify(publico).includes('fulano@exemplo.com'));
    assert.equal((await readdir(join(dir, 'anexos'))).length, 0, 'anexos apagados após decisão');

    assert.equal(await repo.removerPeloAutor(protocolo, 'codigo-errado'), false);
    assert.equal(await repo.removerPeloAutor(protocolo.toLowerCase(), codigoRemocao), true);
    assert.equal(repo.listarPublicos('demo-001').itens.length, 0);

    // Retenção: relato pendente some depois de 90 dias
    await repo.criar(relato);
    agora = new Date('2026-04-15T00:00:00Z');
    await repo.aplicarRetencao();
    assert.equal(repo.listarParaModeracao().relatos.length, 0);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
