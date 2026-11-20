import { Dinheiro } from "../../../shared/dinheiro";
import { ErroDeNegocio, NaoEncontrado } from "../../../shared/erros";
import type { EventBus } from "../../../shared/eventos";
import type { ContratoId, ImovelId, PessoaId } from "../../../shared/ids";
import type { Relogio } from "../../../shared/relogio";
import { isoDia } from "../../../shared/datas";
// Dependências de outros módulos: SOMENTE pelas interfaces públicas (api/).
import type { ImoveisApi } from "../../imoveis/api";
import type { PessoasApi } from "../../pessoas/api";
import { EVENTO_CONTRATO_ATIVADO, EVENTO_CONTRATO_ENCERRADO, type ContratoAtivado, type ContratoEncerrado } from "../api";
import { Contrato, type ContratoRepositorio } from "../domain/contrato";

export interface ComandoCriarContrato {
  imovelId: ImovelId;
  locatarioId: PessoaId;
  fiadorId?: PessoaId;
  valorAluguel: number; // reais (borda HTTP)
  taxaAdministracaoPercentual: number;
  diaVencimento: number;
  inicio: string;
  mesesVigencia: number;
}

export class ContratosServico {
  constructor(
    private readonly repositorio: ContratoRepositorio,
    private readonly imoveis: ImoveisApi,   // injetado (DIP): Contratos não conhece a implementação
    private readonly pessoas: PessoasApi,
    private readonly eventos: EventBus,
    private readonly relogio: Relogio,
  ) {}

  async criar(cmd: ComandoCriarContrato): Promise<Contrato> {
    const imovel = await this.imoveis.obter(cmd.imovelId);
    if (!imovel) throw new NaoEncontrado("Imóvel", cmd.imovelId);
    for (const id of [cmd.locatarioId, cmd.fiadorId].filter(Boolean) as PessoaId[]) {
      if (!(await this.pessoas.existe(id))) throw new NaoEncontrado("Pessoa", id);
    }
    const contrato = Contrato.criar({
      imovelId: imovel.id,
      locadorId: imovel.proprietarioId, // o locador é sempre o proprietário do imóvel
      locatarioId: cmd.locatarioId,
      fiadorId: cmd.fiadorId,
      valorAluguel: Dinheiro.deReais(cmd.valorAluguel),
      taxaAdministracaoPercentual: cmd.taxaAdministracaoPercentual,
      diaVencimento: cmd.diaVencimento,
      inicio: cmd.inicio,
      mesesVigencia: cmd.mesesVigencia,
    });
    await this.repositorio.salvar(contrato);
    return contrato;
  }

  /**
   * Ativação: aqui EXISTE conascência de execução (ordem importa):
   *   1) reservar o imóvel (síncrono — precisa de resposta imediata para evitar
   *      dois contratos no mesmo imóvel); 2) ativar e salvar; 3) publicar evento.
   * Ela é mantida, mas confinada a este único método (alta localidade), com
   * compensação caso o passo 2 falhe.
   */
  async ativar(id: ContratoId): Promise<Contrato> {
    const contrato = await this.carregar(id);
    if (contrato.status !== "RASCUNHO") throw new ErroDeNegocio("Somente contratos em rascunho podem ser ativados");
    await this.imoveis.reservarParaLocacao(contrato.imovelId);
    try {
      contrato.ativar();
      await this.repositorio.salvar(contrato);
    } catch (erro) {
      await this.imoveis.liberar(contrato.imovelId); // compensação
      throw erro;
    }
    const evento: ContratoAtivado = {
      tipo: EVENTO_CONTRATO_ATIVADO, versao: 1, ocorridoEm: this.relogio.agora().toISOString(),
      contratoId: contrato.id, imovelId: contrato.imovelId, locatarioId: contrato.locatarioId, locadorId: contrato.locadorId,
      valorAluguelCentavos: contrato.valorAluguel.centavos, taxaAdministracaoPercentual: contrato.taxaAdministracaoPercentual,
      diaVencimento: contrato.diaVencimento, inicio: contrato.inicio, fim: contrato.fim,
    };
    this.eventos.publicar(evento); // Financeiro, Relatórios... reagem de forma assíncrona
    return contrato;
  }

  async encerrar(id: ContratoId, motivo: string): Promise<Contrato> {
    const contrato = await this.carregar(id);
    const hoje = isoDia(this.relogio.agora());
    contrato.encerrar(hoje);
    await this.repositorio.salvar(contrato);
    await this.imoveis.liberar(contrato.imovelId);
    const evento: ContratoEncerrado = {
      tipo: EVENTO_CONTRATO_ENCERRADO, versao: 1, ocorridoEm: this.relogio.agora().toISOString(),
      contratoId: contrato.id, imovelId: contrato.imovelId, encerradoEm: hoje, motivo: motivo || "não informado",
    };
    this.eventos.publicar(evento);
    return contrato;
  }

  listar(): Promise<Contrato[]> {
    return this.repositorio.todos();
  }

  async obter(id: ContratoId): Promise<Contrato> {
    return this.carregar(id);
  }

  private async carregar(id: ContratoId): Promise<Contrato> {
    const c = await this.repositorio.porId(id);
    if (!c) throw new NaoEncontrado("Contrato", id);
    return c;
  }
}
