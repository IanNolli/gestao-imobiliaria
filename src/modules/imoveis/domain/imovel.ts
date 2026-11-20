import { Dinheiro } from "../../../shared/dinheiro";
import { ErroDeNegocio } from "../../../shared/erros";
import { novoId, type ImovelId, type PessoaId } from "../../../shared/ids";

export enum StatusImovel {
  Disponivel = "DISPONIVEL",
  Locado = "LOCADO",
  Inativo = "INATIVO",
}

export type TipoImovel = "CASA" | "APARTAMENTO" | "SALA_COMERCIAL" | "TERRENO";

export interface DadosNovoImovel {
  endereco: string;
  tipo: TipoImovel;
  proprietarioId: PessoaId;
  areaM2: number;
  valorAluguelSugerido: number; // em reais, na borda HTTP
}

export class Imovel {
  private constructor(
    readonly id: ImovelId,
    readonly endereco: string,
    readonly tipo: TipoImovel,
    readonly proprietarioId: PessoaId,
    readonly areaM2: number,
    readonly valorAluguelSugerido: Dinheiro,
    private _status: StatusImovel,
  ) {}

  static criar(d: DadosNovoImovel): Imovel {
    if (!d.endereco?.trim()) throw new ErroDeNegocio("Endereço é obrigatório");
    if (!(d.areaM2 > 0)) throw new ErroDeNegocio("Área deve ser positiva");
    return new Imovel(novoId<ImovelId>("imo"), d.endereco.trim(), d.tipo, d.proprietarioId, d.areaM2, Dinheiro.deReais(d.valorAluguelSugerido), StatusImovel.Disponivel);
  }

  get status(): StatusImovel {
    return this._status;
  }

  reservar(): void {
    if (this._status !== StatusImovel.Disponivel) throw new ErroDeNegocio(`Imóvel ${this.id} não está disponível (status: ${this._status})`);
    this._status = StatusImovel.Locado;
  }

  liberar(): void {
    if (this._status === StatusImovel.Locado) this._status = StatusImovel.Disponivel;
  }

  toJSON() {
    const { id, endereco, tipo, proprietarioId, areaM2, valorAluguelSugerido, status } = this;
    return { id, endereco, tipo, proprietarioId, areaM2, valorAluguelSugerido, status };
  }
}

export interface ImovelRepositorio {
  salvar(imovel: Imovel): Promise<void>;
  porId(id: ImovelId): Promise<Imovel | null>;
  todos(): Promise<Imovel[]>;
}
