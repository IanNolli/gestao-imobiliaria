import type { PessoaId } from "../../../shared/ids";

/** Contrato público do módulo Pessoas. Outros módulos SÓ podem importar daqui. */
export interface PessoaResumo {
  id: PessoaId;
  nome: string;
  email: string;
}

export interface PessoasApi {
  existe(id: PessoaId): Promise<boolean>;
  obterResumo(id: PessoaId): Promise<PessoaResumo | null>;
}
