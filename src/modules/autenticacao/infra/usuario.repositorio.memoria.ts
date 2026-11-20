import type { Usuario, UsuarioRepositorio } from "../domain/usuario";

export class UsuarioRepositorioEmMemoria implements UsuarioRepositorio {
  private readonly dados = new Map<string, Usuario>();
  async salvar(u: Usuario) { this.dados.set(u.email, u); }
  async porEmail(email: string) { return this.dados.get(email.toLowerCase()) ?? null; }
}
