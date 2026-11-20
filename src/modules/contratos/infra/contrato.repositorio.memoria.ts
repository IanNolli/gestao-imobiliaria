import type { ContratoId } from "../../../shared/ids";
import type { Contrato, ContratoRepositorio } from "../domain/contrato";

export class ContratoRepositorioEmMemoria implements ContratoRepositorio {
  private readonly dados = new Map<ContratoId, Contrato>();
  async salvar(c: Contrato) { this.dados.set(c.id, c); }
  async porId(id: ContratoId) { return this.dados.get(id) ?? null; }
  async todos() { return [...this.dados.values()]; }
}
