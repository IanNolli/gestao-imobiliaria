import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { ErroDeNegocio } from "../../../shared/erros";
import { novoId, type UsuarioId } from "../../../shared/ids";
import type { Perfil } from "../api";

export class Usuario {
  private constructor(readonly id: UsuarioId, readonly email: string, readonly perfil: Perfil, private readonly hashSenha: string) {}

  static criar(email: string, senha: string, perfil: Perfil): Usuario {
    if (!senha || senha.length < 8) throw new ErroDeNegocio("Senha deve ter ao menos 8 caracteres");
    const sal = randomBytes(16).toString("hex");
    return new Usuario(novoId<UsuarioId>("usr"), email.toLowerCase(), perfil, `${sal}:${scryptSync(senha, sal, 32).toString("hex")}`);
  }

  confereSenha(senha: string): boolean {
    const [sal, hash] = this.hashSenha.split(":");
    return timingSafeEqual(Buffer.from(hash, "hex"), scryptSync(senha, sal, 32));
  }

  toJSON() {
    return { id: this.id, email: this.email, perfil: this.perfil };
  }
}

export interface UsuarioRepositorio {
  salvar(u: Usuario): Promise<void>;
  porEmail(email: string): Promise<Usuario | null>;
}
