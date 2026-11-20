import type { CobrancaId, ContratoId, PessoaId } from "../../../shared/ids";
import type { EventoDeDominio } from "../../../shared/eventos";

/** Eventos publicados pelo módulo Financeiro (contrato público). */
export const EVENTO_PAGAMENTO_REGISTRADO = "financeiro.PagamentoRegistrado" as const;
export const EVENTO_COBRANCA_VENCIDA = "financeiro.CobrancaVencida" as const;

export interface PagamentoRegistrado extends EventoDeDominio {
  tipo: typeof EVENTO_PAGAMENTO_REGISTRADO;
  versao: 1;
  cobrancaId: CobrancaId;
  contratoId: ContratoId;
  locatarioId: PessoaId;
  competencia: string; // YYYY-MM
  valorPrincipalCentavos: number;
  encargosCentavos: number;       // multa + juros, já calculados AQUI (evita conascência de algoritmo)
  valorPagoCentavos: number;
  repasseProprietarioCentavos: number;
  pagoEm: string;
}

export interface CobrancaVencida extends EventoDeDominio {
  tipo: typeof EVENTO_COBRANCA_VENCIDA;
  versao: 1;
  cobrancaId: CobrancaId;
  contratoId: ContratoId;
  locatarioId: PessoaId;
  competencia: string;
  vencimento: string;
  valorCentavos: number;
}
