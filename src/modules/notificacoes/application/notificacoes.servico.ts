import { Dinheiro } from "../../../shared/dinheiro";
import type { EventBus } from "../../../shared/eventos";
import type { PessoaId } from "../../../shared/ids";
import { EVENTO_COBRANCA_VENCIDA, EVENTO_PAGAMENTO_REGISTRADO, type CobrancaVencida, type PagamentoRegistrado } from "../../financeiro/api";
import type { PessoasApi } from "../../pessoas/api";

/** Porta de saída: o módulo não conhece SMTP, SendGrid etc. — só esta interface. */
export interface EnviadorEmail {
  enviar(para: string, assunto: string, corpo: string): Promise<void>;
}

export class NotificacoesServico {
  constructor(private readonly pessoas: PessoasApi, private readonly email: EnviadorEmail) {}

  assinarEventos(eventos: EventBus): void {
    eventos.assinar<PagamentoRegistrado>(EVENTO_PAGAMENTO_REGISTRADO, (e) =>
      this.notificar(e.locatarioId, `Recibo de aluguel ${e.competencia}`, `Recebemos R$ ${Dinheiro.deCentavos(e.valorPagoCentavos).emReais().toFixed(2)} em ${e.pagoEm}.`),
    );
    eventos.assinar<CobrancaVencida>(EVENTO_COBRANCA_VENCIDA, (e) =>
      this.notificar(e.locatarioId, `Aluguel ${e.competencia} em atraso`, `A cobrança com vencimento em ${e.vencimento} está em aberto.`),
    );
  }

  private async notificar(pessoaId: PessoaId, assunto: string, corpo: string): Promise<void> {
    const pessoa = await this.pessoas.obterResumo(pessoaId);
    if (pessoa) await this.email.enviar(pessoa.email, assunto, `Olá, ${pessoa.nome}. ${corpo}`);
  }
}
