import type { ImovelId, PessoaId } from "../../../shared/ids";

/** Contrato público do módulo Imóveis. */
export interface ImovelResumo {
  id: ImovelId;
  endereco: string;
  proprietarioId: PessoaId;
  status: "DISPONIVEL" | "LOCADO" | "INATIVO";
}

export interface ImoveisApi {
  obter(id: ImovelId): Promise<ImovelResumo | null>;
  /** Reserva o imóvel para um contrato. Falha se já estiver locado (consistência imediata). */
  reservarParaLocacao(id: ImovelId): Promise<void>;
  liberar(id: ImovelId): Promise<void>;
}
