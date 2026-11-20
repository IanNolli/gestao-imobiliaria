import { Dinheiro } from "../../../shared/dinheiro";
import { ErroDeNegocio } from "../../../shared/erros";
import { novoId, type ContratoId, type ImovelId, type PessoaId } from "../../../shared/ids";
import { diaUtc, isoDia } from "../../../shared/datas";

export enum StatusContrato {
  Rascunho = "RASCUNHO",
  Ativo = "ATIVO",
  Encerrado = "ENCERRADO",
}

/**
 * Parâmetros nomeados (objeto) em vez de 8 argumentos posicionais.
 * Reduz conascência de POSIÇÃO para conascência de NOME: trocar a ordem dos
 * campos não altera o significado, e locador/locatário não podem ser invertidos
 * por engano (são nomeados e tipados).
 */
export interface DadosNovoContrato {
  imovelId: ImovelId;
  locadorId: PessoaId;
  locatarioId: PessoaId;
  fiadorId?: PessoaId;
  valorAluguel: Dinheiro;
  taxaAdministracaoPercentual: number;
  diaVencimento: number;
  inicio: string;
  mesesVigencia: number;
}

export class Contrato {
  private constructor(
    readonly id: ContratoId,
    readonly imovelId: ImovelId,
    readonly locadorId: PessoaId,
    readonly locatarioId: PessoaId,
    readonly fiadorId: PessoaId | undefined,
    private _valorAluguel: Dinheiro,
    readonly taxaAdministracaoPercentual: number,
    readonly diaVencimento: number,
    readonly inicio: string,
    readonly fim: string,
    private _status: StatusContrato,
    private _encerradoEm?: string,
  ) {}

  static criar(d: DadosNovoContrato): Contrato {
    if (d.locadorId === d.locatarioId) throw new ErroDeNegocio("Locador e locatário devem ser pessoas diferentes");
    if (d.valorAluguel.centavos <= 0) throw new ErroDeNegocio("Valor do aluguel deve ser positivo");
    if (d.diaVencimento < 1 || d.diaVencimento > 28) throw new ErroDeNegocio("Dia de vencimento deve estar entre 1 e 28");
    if (d.taxaAdministracaoPercentual < 0 || d.taxaAdministracaoPercentual > 100) throw new ErroDeNegocio("Taxa de administração inválida");
    if (!(d.mesesVigencia >= 1)) throw new ErroDeNegocio("Vigência mínima de 1 mês");
    const inicio = diaUtc(d.inicio);
    const fim = new Date(inicio);
    fim.setUTCMonth(fim.getUTCMonth() + d.mesesVigencia);
    fim.setUTCDate(fim.getUTCDate() - 1);
    return new Contrato(
      novoId<ContratoId>("ctr"), d.imovelId, d.locadorId, d.locatarioId, d.fiadorId, d.valorAluguel,
      d.taxaAdministracaoPercentual, d.diaVencimento, isoDia(inicio), isoDia(fim), StatusContrato.Rascunho,
    );
  }

  get status() { return this._status; }
  get valorAluguel() { return this._valorAluguel; }
  get encerradoEm() { return this._encerradoEm; }

  ativar(): void {
    if (this._status !== StatusContrato.Rascunho) throw new ErroDeNegocio("Somente contratos em rascunho podem ser ativados");
    this._status = StatusContrato.Ativo;
  }

  encerrar(data: string): void {
    if (this._status !== StatusContrato.Ativo) throw new ErroDeNegocio("Somente contratos ativos podem ser encerrados");
    this._status = StatusContrato.Encerrado;
    this._encerradoEm = data;
  }

  /** Reajuste anual (ex.: IGP-M/IPCA). Afeta apenas cobranças futuras. */
  reajustar(percentual: number): void {
    if (this._status !== StatusContrato.Ativo) throw new ErroDeNegocio("Só é possível reajustar contratos ativos");
    this._valorAluguel = this._valorAluguel.somar(this._valorAluguel.percentual(percentual));
  }

  toJSON() {
    return {
      id: this.id, imovelId: this.imovelId, locadorId: this.locadorId, locatarioId: this.locatarioId, fiadorId: this.fiadorId,
      valorAluguel: this._valorAluguel, taxaAdministracaoPercentual: this.taxaAdministracaoPercentual,
      diaVencimento: this.diaVencimento, inicio: this.inicio, fim: this.fim, status: this._status, encerradoEm: this._encerradoEm,
    };
  }
}

export interface ContratoRepositorio {
  salvar(c: Contrato): Promise<void>;
  porId(id: ContratoId): Promise<Contrato | null>;
  todos(): Promise<Contrato[]>;
}
