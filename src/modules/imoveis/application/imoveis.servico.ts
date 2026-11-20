import { NaoEncontrado } from "../../../shared/erros";
import type { ImovelId } from "../../../shared/ids";
import type { ImoveisApi, ImovelResumo } from "../api";
import { Imovel, type DadosNovoImovel, type ImovelRepositorio } from "../domain/imovel";

export class ImoveisServico implements ImoveisApi {
  constructor(private readonly repositorio: ImovelRepositorio) {}

  async cadastrar(dados: DadosNovoImovel): Promise<Imovel> {
    const imovel = Imovel.criar(dados);
    await this.repositorio.salvar(imovel);
    return imovel;
  }

  listar(): Promise<Imovel[]> {
    return this.repositorio.todos();
  }

  // ---- contrato público (ImoveisApi) ----
  async obter(id: ImovelId): Promise<ImovelResumo | null> {
    const i = await this.repositorio.porId(id);
    return i ? { id: i.id, endereco: i.endereco, proprietarioId: i.proprietarioId, status: i.status } : null;
  }

  async reservarParaLocacao(id: ImovelId): Promise<void> {
    const imovel = await this.carregar(id);
    imovel.reservar();
    await this.repositorio.salvar(imovel);
  }

  async liberar(id: ImovelId): Promise<void> {
    const imovel = await this.carregar(id);
    imovel.liberar();
    await this.repositorio.salvar(imovel);
  }

  private async carregar(id: ImovelId): Promise<Imovel> {
    const imovel = await this.repositorio.porId(id);
    if (!imovel) throw new NaoEncontrado("Imóvel", id);
    return imovel;
  }
}
