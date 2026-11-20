import type { EventBus } from "../../shared/eventos";
import { ProjecaoRelatorios } from "./application/relatorios.projecao";
import { rotasRelatorios } from "./http/relatorios.rotas";

export const criarModuloRelatorios = (deps: { eventos: EventBus }) => {
  const projecao = new ProjecaoRelatorios(deps.eventos);
  return { projecao, rotas: rotasRelatorios(projecao) };
};
