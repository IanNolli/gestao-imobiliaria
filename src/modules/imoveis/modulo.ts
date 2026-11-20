import { ImoveisServico } from "./application/imoveis.servico";
import { rotasImoveis } from "./http/imoveis.rotas";
import { ImovelRepositorioEmMemoria } from "./infra/imovel.repositorio.memoria";

export const criarModuloImoveis = () => {
  const servico = new ImoveisServico(new ImovelRepositorioEmMemoria());
  return { api: servico, servico, rotas: rotasImoveis(servico) };
};
