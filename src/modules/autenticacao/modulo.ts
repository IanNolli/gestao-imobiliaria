import type { Relogio } from "../../shared/relogio";
import { AutenticacaoServico } from "./application/autenticacao.servico";
import { rotasAutenticacao, rotasUsuarios } from "./http/autenticacao.rotas";
import { UsuarioRepositorioEmMemoria } from "./infra/usuario.repositorio.memoria";

export const criarModuloAutenticacao = (deps: { segredoJwt: string; relogio: Relogio }) => {
  const servico = new AutenticacaoServico(new UsuarioRepositorioEmMemoria(), deps.segredoJwt, deps.relogio);
  return { api: servico, servico, rotasLogin: rotasAutenticacao(servico), rotasUsuarios: rotasUsuarios(servico) };
};
