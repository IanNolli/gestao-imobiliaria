import { PessoasServico } from "./application/pessoas.servico";
import { rotasPessoas } from "./http/pessoas.rotas";
import { PessoaRepositorioEmMemoria } from "./infra/pessoa.repositorio.memoria";

/** Ponto de montagem do módulo — usado apenas pela composition root (src/app.ts). */
export const criarModuloPessoas = () => {
  const servico = new PessoasServico(new PessoaRepositorioEmMemoria());
  return { api: servico, servico, rotas: rotasPessoas(servico) };
};
