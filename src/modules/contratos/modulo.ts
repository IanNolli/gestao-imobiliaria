import type { EventBus } from "../../shared/eventos";
import type { Relogio } from "../../shared/relogio";
import type { ImoveisApi } from "../imoveis/api";
import type { PessoasApi } from "../pessoas/api";
import { ContratosServico } from "./application/contratos.servico";
import { rotasContratos } from "./http/contratos.rotas";
import { ContratoRepositorioEmMemoria } from "./infra/contrato.repositorio.memoria";

export const criarModuloContratos = (deps: { imoveis: ImoveisApi; pessoas: PessoasApi; eventos: EventBus; relogio: Relogio }) => {
  const servico = new ContratosServico(new ContratoRepositorioEmMemoria(), deps.imoveis, deps.pessoas, deps.eventos, deps.relogio);
  return { servico, rotas: rotasContratos(servico) };
};
