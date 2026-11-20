import { Dinheiro } from "../../../shared/dinheiro";
import { ErroDeNegocio } from "../../../shared/erros";
import { novoId, type CobrancaId, type ContratoId, type PessoaId } from "../../../shared/ids";
import { diaUtc } from "../../../shared/datas";
import type { CalculadoraEncargos } from "./calculadora-encargos";

export enum StatusCobranca {
  Aberta = "ABERTA",
  Vencida = "VENCIDA",
  Paga = "PAGA",
  Cancelada = "CANCELADA",
}

export interface Pagamento {
  pagoEm: string;
  encargos: Dinheiro;
  valorPago: Dinheiro;
  repasseProprietario: Dinheiro;
}

export interface DadosNovaCobranca {
  contratoId: ContratoId;
  locatarioId: PessoaId;
  competencia: string;
  vencimento: string;
  valor: Dinheiro;
  taxaAdministracaoPercentual: number;
}

/** Cobrança mensal (título a receber) de um contrato. Coesão funcional: tudo aqui trata do ciclo de vida do recebimento. */
export class Cobranca {
  private _status = StatusCobranca.Aberta;
  private _pagamento?: Pagamento;

  constructor(
    readonly id: CobrancaId,
    readonly contratoId: ContratoId,
    readonly locatarioId: PessoaId,
    readonly competencia: string, // YYYY-MM (mês de uso do imóvel)
    readonly vencimento: string,  // YYYY-MM-DD
    readonly valor: Dinheiro,
    readonly taxaAdministracaoPercentual: number,
  ) {}

  static nova(d: DadosNovaCobranca): Cobranca {
    return new Cobranca(novoId<CobrancaId>("cob"), d.contratoId, d.locatarioId, d.competencia, d.vencimento, d.valor, d.taxaAdministracaoPercentual);
  }

  get status() { return this._status; }
  get pagamento() { return this._pagamento; }

  registrarPagamento(pagoEm: string, calculadora: CalculadoraEncargos, valorInformado?: Dinheiro): Pagamento {
    if (this._status === StatusCobranca.Paga) throw new ErroDeNegocio("Cobrança já está paga");
    if (this._status === StatusCobranca.Cancelada) throw new ErroDeNegocio("Cobrança cancelada não pode ser paga");
    const encargos = calculadora.calcular(this.valor, diaUtc(this.vencimento), diaUtc(pagoEm));
    const devido = this.valor.somar(encargos);
    const valorPago = valorInformado ?? devido;
    if (valorPago.centavos < devido.centavos) throw new ErroDeNegocio(`Valor insuficiente: devido R$ ${devido.emReais().toFixed(2)}`);
    // Imobiliária retém a taxa de administração sobre o aluguel; o restante é repassado ao proprietário.
    const repasseProprietario = valorPago.subtrair(this.valor.percentual(this.taxaAdministracaoPercentual));
    this._pagamento = { pagoEm, encargos, valorPago, repasseProprietario };
    this._status = StatusCobranca.Paga;
    return this._pagamento;
  }

  marcarComoVencida(hoje: Date): boolean {
    if (this._status !== StatusCobranca.Aberta || diaUtc(this.vencimento) >= hoje) return false;
    this._status = StatusCobranca.Vencida;
    return true;
  }

  cancelar(): void {
    if (this._status === StatusCobranca.Aberta || this._status === StatusCobranca.Vencida) this._status = StatusCobranca.Cancelada;
  }

  toJSON() {
    const { id, contratoId, locatarioId, competencia, vencimento, valor, status, pagamento } = this;
    return { id, contratoId, locatarioId, competencia, vencimento, valor, status, pagamento };
  }
}

export interface CobrancaRepositorio {
  salvar(c: Cobranca): Promise<void>;
  porId(id: CobrancaId): Promise<Cobranca | null>;
  porContrato(contratoId: ContratoId): Promise<Cobranca[]>;
  todas(): Promise<Cobranca[]>;
}
