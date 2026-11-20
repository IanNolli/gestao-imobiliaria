import type { ContratoId, ImovelId, PessoaId } from "../../../shared/ids";
import type { EventoDeDominio } from "../../../shared/eventos";

/**
 * Contrato público do módulo Contratos: os EVENTOS que ele publica.
 * Consumidores (Financeiro, Relatórios) dependem apenas destes nomes e tipos
 * (conascência de nome e de tipo — as formas mais fracas). O campo `versao`
 * permite evoluir o formato sem quebrar consumidores antigos.
 */
export const EVENTO_CONTRATO_ATIVADO = "contratos.ContratoAtivado" as const;
export const EVENTO_CONTRATO_ENCERRADO = "contratos.ContratoEncerrado" as const;

export interface ContratoAtivado extends EventoDeDominio {
  tipo: typeof EVENTO_CONTRATO_ATIVADO;
  versao: 1;
  contratoId: ContratoId;
  imovelId: ImovelId;
  locatarioId: PessoaId;
  locadorId: PessoaId;
  valorAluguelCentavos: number;
  taxaAdministracaoPercentual: number;
  diaVencimento: number;
  inicio: string; // YYYY-MM-DD
  fim: string;    // YYYY-MM-DD
}

export interface ContratoEncerrado extends EventoDeDominio {
  tipo: typeof EVENTO_CONTRATO_ENCERRADO;
  versao: 1;
  contratoId: ContratoId;
  imovelId: ImovelId;
  encerradoEm: string; // YYYY-MM-DD
  motivo: string;
}
