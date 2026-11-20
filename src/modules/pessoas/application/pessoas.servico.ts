import { ErroDeNegocio } from "../../../shared/erros";
import type { PessoaId } from "../../../shared/ids";
import type { PessoaResumo, PessoasApi } from "../api";
import { Pessoa, type DadosNovaPessoa, type PessoaRepositorio } from "../domain/pessoa";

export class PessoasServico implements PessoasApi {
  constructor(private readonly repositorio: PessoaRepositorio) {}

  async cadastrar(dados: DadosNovaPessoa): Promise<Pessoa> {
    const pessoa = Pessoa.criar(dados);
    if (await this.repositorio.porDocumento(pessoa.documento)) throw new ErroDeNegocio("Já existe pessoa com este documento");
    await this.repositorio.salvar(pessoa);
    return pessoa;
  }

  listar(): Promise<Pessoa[]> {
    return this.repositorio.todas();
  }

  // ---- implementação do contrato público (PessoasApi) ----
  async existe(id: PessoaId): Promise<boolean> {
    return (await this.repositorio.porId(id)) !== null;
  }

  async obterResumo(id: PessoaId): Promise<PessoaResumo | null> {
    const p = await this.repositorio.porId(id);
    return p ? { id: p.id, nome: p.nome, email: p.email } : null;
  }
}
