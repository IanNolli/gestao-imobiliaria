import { Dinheiro } from "../../../shared/dinheiro";
import { NaoEncontrado } from "../../../shared/erros";
import type { EventBus } from "../../../shared/eventos";
import type { CobrancaId, ContratoId } from "../../../shared/ids";
import type { Relogio } from "../../../shared/relogio";
import { diaUtc, isoDia } from "../../../shared/datas";
// Financeiro conhece APENAS o formato dos eventos de Contratos (nome + tipo), nunca suas classes internas.
import { EVENTO_CONTRATO_ATIVADO, EVENTO_CONTRATO_ENCERRADO, type ContratoAtivado, type ContratoEncerrado } from "../../contratos/api";
import { EVENTO_COBRANCA_VENCIDA, EVENTO_PAGAMENTO_REGISTRADO, type CobrancaVencida, type PagamentoRegistrado } from "../api";
import type { CalculadoraEncargos } from "../domain/calculadora-encargos";
import { Cobranca, type CobrancaRepositorio } from "../domain/cobranca";

export class FinanceiroServico {
  constructor(
    private readonly repositorio: CobrancaRepositorio,
    private readonly calculadora: CalculadoraEncargos,
    private readonly eventos: EventBus,
    private readonly relogio: Relogio,
  ) {}

  /** Registra os manipuladores de eventos de outros módulos. */
  assinarEventos(): void {
    this.eventos.assinar<ContratoAtivado>(EVENTO_CONTRATO_ATIVADO, async (e) => { await this.gerarCobrancas(e); });
    this.eventos.assinar<ContratoEncerrado>(EVENTO_CONTRATO_ENCERRADO, (e) => this.cancelarCobrancasFuturas(e));
  }

  /** Gera uma cobrança por mês de vigência. Idempotente: reprocessar o evento não duplica cobranças. */
  async gerarCobrancas(e: ContratoAtivado): Promise<Cobranca[]> {
    const existentes = await this.repositorio.porContrato(e.contratoId);
    if (existentes.length > 0) return existentes;
    const geradas: Cobranca[] = [];
    const fim = diaUtc(e.fim);
    for (let mes = diaUtc(e.inicio); mes <= fim; mes = new Date(Date.UTC(mes.getUTCFullYear(), mes.getUTCMonth() + 1, 1))) {
      // Aluguel pós-pago: competência = mês de uso; vencimento no mês seguinte, no dia combinado.
      const vencimento = new Date(Date.UTC(mes.getUTCFullYear(), mes.getUTCMonth() + 1, e.diaVencimento));
      const cobranca = Cobranca.nova({
        contratoId: e.contratoId, locatarioId: e.locatarioId, competencia: isoDia(mes).slice(0, 7), vencimento: isoDia(vencimento),
        valor: Dinheiro.deCentavos(e.valorAluguelCentavos), taxaAdministracaoPercentual: e.taxaAdministracaoPercentual,
      });
      await this.repositorio.salvar(cobranca);
      geradas.push(cobranca);
    }
    return geradas;
  }

  async cancelarCobrancasFuturas(e: ContratoEncerrado): Promise<void> {
    const competenciaEncerramento = e.encerradoEm.slice(0, 7);
    for (const c of await this.repositorio.porContrato(e.contratoId)) {
      if (c.competencia > competenciaEncerramento) {
        c.cancelar();
        await this.repositorio.salvar(c);
      }
    }
  }

  async registrarPagamento(id: CobrancaId, pagoEm?: string, valorPagoReais?: number): Promise<Cobranca> {
    const cobranca = await this.repositorio.porId(id);
    if (!cobranca) throw new NaoEncontrado("Cobrança", id);
    const data = pagoEm ?? isoDia(this.relogio.agora());
    const p = cobranca.registrarPagamento(data, this.calculadora, valorPagoReais !== undefined ? Dinheiro.deReais(valorPagoReais) : undefined);
    await this.repositorio.salvar(cobranca);
    const evento: PagamentoRegistrado = {
      tipo: EVENTO_PAGAMENTO_REGISTRADO, versao: 1, ocorridoEm: this.relogio.agora().toISOString(),
      cobrancaId: cobranca.id, contratoId: cobranca.contratoId, locatarioId: cobranca.locatarioId, competencia: cobranca.competencia,
      valorPrincipalCentavos: cobranca.valor.centavos, encargosCentavos: p.encargos.centavos, valorPagoCentavos: p.valorPago.centavos,
      repasseProprietarioCentavos: p.repasseProprietario.centavos, pagoEm: data,
    };
    this.eventos.publicar(evento);
    return cobranca;
  }

  /** Rotina diária (agendada): marca cobranças vencidas e avisa os interessados via evento. */
  async marcarVencidas(): Promise<number> {
    const hoje = diaUtc(isoDia(this.relogio.agora()));
    let total = 0;
    for (const c of await this.repositorio.todas()) {
      if (c.marcarComoVencida(hoje)) {
        await this.repositorio.salvar(c);
        total++;
        const evento: CobrancaVencida = {
          tipo: EVENTO_COBRANCA_VENCIDA, versao: 1, ocorridoEm: this.relogio.agora().toISOString(),
          cobrancaId: c.id, contratoId: c.contratoId, locatarioId: c.locatarioId, competencia: c.competencia,
          vencimento: c.vencimento, valorCentavos: c.valor.centavos,
        };
        this.eventos.publicar(evento);
      }
    }
    return total;
  }

  listar(contratoId?: ContratoId): Promise<Cobranca[]> {
    return contratoId ? this.repositorio.porContrato(contratoId) : this.repositorio.todas();
  }
}
