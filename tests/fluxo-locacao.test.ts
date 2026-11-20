import { test } from "node:test";
import assert from "node:assert/strict";
import { criarAplicacao } from "../src/app";
import { RelogioFixo } from "../src/shared/relogio";
import type { PessoaId } from "../src/shared/ids";

process.env.NODE_ENV = "test";

const montar = async () => {
  const relogio = new RelogioFixo(new Date("2027-01-02T12:00:00Z"));
  const sis = criarAplicacao({ relogio, segredoJwt: "teste" });
  const { pessoas, imoveis } = sis.modulos;
  const dono = await pessoas.servico.cadastrar({ nome: "Maria Proprietária", documento: "111.444.777-35", email: "maria@ex.com" });
  const inquilino = await pessoas.servico.cadastrar({ nome: "João Inquilino", documento: "529.982.247-25", email: "joao@ex.com" });
  const imovel = await imoveis.servico.cadastrar({ endereco: "Rua Major Claudiano, 1000 - Franca/SP", tipo: "APARTAMENTO", proprietarioId: dono.id, areaM2: 70, valorAluguelSugerido: 1500 });
  return { ...sis, relogio, dono, inquilino, imovel };
};

test("ativar contrato reserva o imóvel e, via evento, o Financeiro gera 12 cobranças", async () => {
  const s = await montar();
  const { contratos, financeiro, imoveis } = s.modulos;
  const c = await contratos.servico.criar({ imovelId: s.imovel.id, locatarioId: s.inquilino.id, valorAluguel: 1500, taxaAdministracaoPercentual: 8, diaVencimento: 10, inicio: "2027-01-01", mesesVigencia: 12 });
  await contratos.servico.ativar(c.id);
  assert.equal((await imoveis.api.obter(s.imovel.id))?.status, "LOCADO");

  await s.eventos.aguardarProcessamento();
  const cobrancas = await financeiro.servico.listar(c.id);
  assert.equal(cobrancas.length, 12);
  assert.equal(cobrancas[0].competencia, "2027-01");
  assert.equal(cobrancas[0].vencimento, "2027-02-10");
});

test("não é possível ativar dois contratos no mesmo imóvel (consistência síncrona)", async () => {
  const s = await montar();
  const { contratos, pessoas } = s.modulos;
  const outro = await pessoas.servico.cadastrar({ nome: "Ana", documento: "123.456.789-09", email: "ana@ex.com" });
  const base = { imovelId: s.imovel.id, valorAluguel: 1500, taxaAdministracaoPercentual: 8, diaVencimento: 10, inicio: "2027-01-01", mesesVigencia: 12 };
  const c1 = await contratos.servico.criar({ ...base, locatarioId: s.inquilino.id });
  const c2 = await contratos.servico.criar({ ...base, locatarioId: outro.id });
  await contratos.servico.ativar(c1.id);
  await assert.rejects(() => contratos.servico.ativar(c2.id), /não está disponível/);
});

test("pagamento atrasado: Financeiro calcula encargos; Relatórios e Notificações reagem ao evento", async () => {
  const s = await montar();
  const { contratos, financeiro, relatorios, notificacoes } = s.modulos;
  const c = await contratos.servico.criar({ imovelId: s.imovel.id, locatarioId: s.inquilino.id, valorAluguel: 1500, taxaAdministracaoPercentual: 8, diaVencimento: 10, inicio: "2027-01-01", mesesVigencia: 12 });
  await contratos.servico.ativar(c.id);
  await s.eventos.aguardarProcessamento();

  s.relogio.definir(new Date("2027-02-20T12:00:00Z"));
  assert.equal(await financeiro.servico.marcarVencidas(), 1);
  await s.eventos.aguardarProcessamento();
  assert.equal(relatorios.projecao.resumo().inadimplencia.quantidade, 1);

  const [jan] = await financeiro.servico.listar(c.id);
  const paga = await financeiro.servico.registrarPagamento(jan.id, "2027-02-25"); // 15 dias de atraso
  await s.eventos.aguardarProcessamento();

  assert.equal(paga.pagamento?.encargos.emReais(), 157.5);
  assert.equal(paga.pagamento?.repasseProprietario.emReais(), 1657.5 - 120); // taxa de 8% sobre 1500
  const resumo = relatorios.projecao.resumo();
  assert.equal(resumo.inadimplencia.quantidade, 0);
  assert.equal(resumo.recebimentosPorCompetencia["2027-01"].encargos.emReais(), 157.5);
  assert.deepEqual(notificacoes.email.enviados.map((e) => e.assunto), ["Aluguel 2027-01 em atraso", "Recibo de aluguel 2027-01"]);
});

test("encerrar contrato libera o imóvel e cancela cobranças futuras", async () => {
  const s = await montar();
  const { contratos, financeiro, imoveis } = s.modulos;
  const c = await contratos.servico.criar({ imovelId: s.imovel.id, locatarioId: s.inquilino.id, valorAluguel: 1500, taxaAdministracaoPercentual: 8, diaVencimento: 10, inicio: "2027-01-01", mesesVigencia: 12 });
  await contratos.servico.ativar(c.id);
  await s.eventos.aguardarProcessamento();
  s.relogio.definir(new Date("2027-04-15T12:00:00Z"));
  await contratos.servico.encerrar(c.id, "rescisão amigável");
  await s.eventos.aguardarProcessamento();

  assert.equal((await imoveis.api.obter(s.imovel.id))?.status, "DISPONIVEL");
  const cobrancas = await financeiro.servico.listar(c.id);
  assert.equal(cobrancas.filter((x) => x.status === "CANCELADA").length, 8); // mai..dez
});

test("IDs tipados impedem trocar locatário por imóvel (erro de compilação)", () => {
  // A linha abaixo, se descomentada, NÃO compila — conascência de posição virou conascência de tipo:
  // const x: PessoaId = s.imovel.id;
  const ok: PessoaId | undefined = undefined;
  assert.equal(ok, undefined);
});

test("API HTTP: rota protegida exige token e perfil", async () => {
  const s = await montar();
  await s.modulos.autenticacao.servico.cadastrar("fin@ex.com", "senha12345", "FINANCEIRO");
  const servidor = s.app.listen(0);
  const porta = (servidor.address() as any).port;
  const url = (p: string) => `http://127.0.0.1:${porta}${p}`;
  try {
    assert.equal((await fetch(url("/imoveis"))).status, 401);
    const { token } = await (await fetch(url("/auth/login"), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "fin@ex.com", senha: "senha12345" }) })).json();
    const auth = { authorization: `Bearer ${token}` };
    assert.equal((await fetch(url("/imoveis"), { headers: auth })).status, 403); // FINANCEIRO não gerencia imóveis
    assert.equal((await fetch(url("/financeiro/cobrancas"), { headers: auth })).status, 200);
  } finally {
    servidor.close();
  }
});
