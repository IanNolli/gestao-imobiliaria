import { createHmac, timingSafeEqual } from "node:crypto";
import { ErroDeNegocio } from "../../../shared/erros";
import type { Relogio } from "../../../shared/relogio";
import type { AutenticacaoApi, Perfil, Sessao } from "../api";
import { Usuario, type UsuarioRepositorio } from "../domain/usuario";

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");

/** Emite e valida JWT (HS256). Nenhum outro módulo conhece este algoritmo — só a interface AutenticacaoApi. */
export class AutenticacaoServico implements AutenticacaoApi {
  constructor(private readonly repositorio: UsuarioRepositorio, private readonly segredo: string, private readonly relogio: Relogio) {}

  async cadastrar(email: string, senha: string, perfil: Perfil): Promise<Usuario> {
    if (await this.repositorio.porEmail(email)) throw new ErroDeNegocio("E-mail já cadastrado");
    const u = Usuario.criar(email, senha, perfil);
    await this.repositorio.salvar(u);
    return u;
  }

  async login(email: string, senha: string): Promise<{ token: string }> {
    const u = await this.repositorio.porEmail(String(email ?? "").toLowerCase());
    if (!u || !u.confereSenha(String(senha ?? ""))) throw Object.assign(new ErroDeNegocio("Credenciais inválidas"), { status: 401 });
    const agora = Math.floor(this.relogio.agora().getTime() / 1000);
    const corpo = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: u.id, email: u.email, perfil: u.perfil, iat: agora, exp: agora + 8 * 3600 })}`;
    return { token: `${corpo}.${this.assinar(corpo)}` };
  }

  verificarToken(token: string): Sessao | null {
    const [h, p, s] = token.split(".");
    if (!h || !p || !s) return null;
    const esperado = Buffer.from(this.assinar(`${h}.${p}`));
    if (esperado.length !== Buffer.from(s).length || !timingSafeEqual(esperado, Buffer.from(s))) return null;
    const dados = JSON.parse(Buffer.from(p, "base64url").toString());
    if (dados.exp * 1000 < this.relogio.agora().getTime()) return null;
    return { usuarioId: dados.sub, email: dados.email, perfil: dados.perfil };
  }

  private assinar(conteudo: string): string {
    return createHmac("sha256", this.segredo).update(conteudo).digest("base64url");
  }
}
