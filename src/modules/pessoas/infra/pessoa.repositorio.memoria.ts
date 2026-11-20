import type { PessoaId } from "../../../shared/ids";
import type { Pessoa, PessoaRepositorio } from "../domain/pessoa";

/** Adaptador de persistência do protótipo. Em produção: tabela no schema `pessoas` do PostgreSQL. */
export class PessoaRepositorioEmMemoria implements PessoaRepositorio {
  private readonly dados = new Map<PessoaId, Pessoa>();
  async salvar(p: Pessoa) { this.dados.set(p.id, p); }
  async porId(id: PessoaId) { return this.dados.get(id) ?? null; }
  async porDocumento(doc: string) { return [...this.dados.values()].find((p) => p.documento === doc) ?? null; }
  async todas() { return [...this.dados.values()]; }
}
