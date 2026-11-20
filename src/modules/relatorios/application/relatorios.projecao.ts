import { Dinheiro } from "../../../shared/dinheiro";
import type { EventBus } from "../../../shared/eventos";
import type { CobrancaId, ContratoId } from "../../../shared/ids";
import { EVENTO_CONTRATO_ATIVADO, EVENTO_CONTRATO_ENCERRADO, type ContratoAtivado, type ContratoEncerrado } from "../../contratos/api";
import { EVENTO_COBRANCA_VENCIDA, EVENTO_PAGAMENTO_REGISTRADO, type CobrancaVencida, type PagamentoRegistrado } from "../../financeiro/api";

/**
 * Relatórios como MODELO DE LEITURA (CQRS leve): o módulo monta sua própria visão
 * a partir de eventos, sem consultar tabelas de outros módulos nem chamá-los.
 * Consequências: zero dependências síncronas; consultas pesadas não afetam as
 * transações; novos relatórios não exigem mudanças nos módulos de origem.
 * Trade-off: consistência eventual (o relatório pode estar alguns ms atrasado).
 */
export class ProjecaoRelatorios {
  private readonly contratosAtivos = new Set<ContratoId>();
  private readonly recebidoPorCompetencia = new Map<string, { principal: number; encargos: number; repasse: number }>();
  private readonly inadimplentes = new Map<CobrancaId, CobrancaVencida>();

  constructor(eventos: EventBus) {
    eventos.assinar<ContratoAtivado>(EVENTO_CONTRATO_ATIVADO, (e) => void this.contratosAtivos.add(e.contratoId));
    eventos.assinar<ContratoEncerrado>(EVENTO_CONTRATO_ENCERRADO, (e) => void this.contratosAtivos.delete(e.contratoId));
    eventos.assinar<CobrancaVencida>(EVENTO_COBRANCA_VENCIDA, (e) => void this.inadimplentes.set(e.cobrancaId, e));
    eventos.assinar<PagamentoRegistrado>(EVENTO_PAGAMENTO_REGISTRADO, (e) => {
      this.inadimplentes.delete(e.cobrancaId);
      const atual = this.recebidoPorCompetencia.get(e.competencia) ?? { principal: 0, encargos: 0, repasse: 0 };
      atual.principal += e.valorPrincipalCentavos;
      atual.encargos += e.encargosCentavos; // valor já calculado pelo Financeiro — não recalculamos aqui
      atual.repasse += e.repasseProprietarioCentavos;
      this.recebidoPorCompetencia.set(e.competencia, atual);
    });
  }

  resumo() {
    const inad = [...this.inadimplentes.values()];
    return {
      contratosAtivos: this.contratosAtivos.size,
      recebimentosPorCompetencia: Object.fromEntries(
        [...this.recebidoPorCompetencia.entries()].map(([comp, v]) => [comp, {
          principal: Dinheiro.deCentavos(v.principal), encargos: Dinheiro.deCentavos(v.encargos), repasseProprietarios: Dinheiro.deCentavos(v.repasse),
        }]),
      ),
      inadimplencia: {
        quantidade: inad.length,
        valorEmAberto: Dinheiro.deCentavos(inad.reduce((s, e) => s + e.valorCentavos, 0)),
        cobrancas: inad.map((e) => ({ cobrancaId: e.cobrancaId, contratoId: e.contratoId, competencia: e.competencia, vencimento: e.vencimento })),
      },
    };
  }
}
