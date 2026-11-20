import type { UsuarioId } from "../../../shared/ids";

export type Perfil = "ADMIN" | "CORRETOR" | "FINANCEIRO";

export interface Sessao {
  usuarioId: UsuarioId;
  email: string;
  perfil: Perfil;
}

/** Contrato público: usado pela camada HTTP para proteger as rotas de TODOS os módulos. */
export interface AutenticacaoApi {
  verificarToken(token: string): Sessao | null;
}
