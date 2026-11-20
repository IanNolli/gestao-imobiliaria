import type { CobrancaId, ContratoId } from "../../../shared/ids";
import type { Cobranca, CobrancaRepositorio } from "../domain/cobranca";

export class CobrancaRepositorioEmMemoria implements CobrancaRepositorio {
  private readonly dados = new Map<CobrancaId, Cobranca>();
  async salvar(c: Cobranca) { this.dados.set(c.id, c); }
  async porId(id: CobrancaId) { return this.dados.get(id) ?? null; }
  async porContrato(contratoId: ContratoId) { return [...this.dados.values()].filter((c) => c.contratoId === contratoId); }
  async todas() { return [...this.dados.values()]; }
}
