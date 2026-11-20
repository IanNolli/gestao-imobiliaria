import type { ImovelId } from "../../../shared/ids";
import type { Imovel, ImovelRepositorio } from "../domain/imovel";

export class ImovelRepositorioEmMemoria implements ImovelRepositorio {
  private readonly dados = new Map<ImovelId, Imovel>();
  async salvar(i: Imovel) { this.dados.set(i.id, i); }
  async porId(id: ImovelId) { return this.dados.get(id) ?? null; }
  async todos() { return [...this.dados.values()]; }
}
