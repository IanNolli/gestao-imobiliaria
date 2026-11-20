import { ErroDeNegocio } from "../../../shared/erros";
import { novoId, type PessoaId } from "../../../shared/ids";

export type TipoDocumento = "CPF" | "CNPJ";

export interface DadosNovaPessoa {
  nome: string;
  documento: string;
  email: string;
  telefone?: string;
}

/** Pessoa = parte de um contrato (proprietário, inquilino ou fiador). O papel é definido pelo contrato. */
export class Pessoa {
  private constructor(
    readonly id: PessoaId,
    readonly nome: string,
    readonly documento: string,
    readonly tipoDocumento: TipoDocumento,
    readonly email: string,
    readonly telefone?: string,
  ) {}

  static criar(dados: DadosNovaPessoa): Pessoa {
    const documento = dados.documento.replace(/\D/g, "");
    if (!dados.nome?.trim()) throw new ErroDeNegocio("Nome é obrigatório");
    if (documento.length !== 11 && documento.length !== 14) throw new ErroDeNegocio("Documento deve ser CPF (11) ou CNPJ (14 dígitos)");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(dados.email)) throw new ErroDeNegocio("E-mail inválido");
    return new Pessoa(novoId<PessoaId>("pes"), dados.nome.trim(), documento, documento.length === 11 ? "CPF" : "CNPJ", dados.email, dados.telefone);
  }
}

export interface PessoaRepositorio {
  salvar(pessoa: Pessoa): Promise<void>;
  porId(id: PessoaId): Promise<Pessoa | null>;
  porDocumento(documento: string): Promise<Pessoa | null>;
  todas(): Promise<Pessoa[]>;
}
