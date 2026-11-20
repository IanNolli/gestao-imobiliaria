import type { EventBus } from "../../shared/eventos";
import type { Relogio } from "../../shared/relogio";
import { FinanceiroServico } from "./application/financeiro.servico";
import { CalculadoraEncargos, type PoliticaEncargos } from "./domain/calculadora-encargos";
import { rotasFinanceiro } from "./http/financeiro.rotas";
import { CobrancaRepositorioEmMemoria } from "./infra/cobranca.repositorio.memoria";

export const criarModuloFinanceiro = (deps: { eventos: EventBus; relogio: Relogio; politica?: PoliticaEncargos }) => {
  const servico = new FinanceiroServico(new CobrancaRepositorioEmMemoria(), new CalculadoraEncargos(deps.politica), deps.eventos, deps.relogio);
  servico.assinarEventos();
  return { servico, rotas: rotasFinanceiro(servico) };
};
