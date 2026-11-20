import express from "express";
import { EventBusEmMemoria } from "./shared/eventos";
import { RelogioDoSistema, type Relogio } from "./shared/relogio";
import { exigirPerfil } from "./http/seguranca";
import { criarModuloAutenticacao } from "./modules/autenticacao/modulo";
import { criarModuloPessoas } from "./modules/pessoas/modulo";
import { criarModuloImoveis } from "./modules/imoveis/modulo";
import { criarModuloContratos } from "./modules/contratos/modulo";
import { criarModuloFinanceiro } from "./modules/financeiro/modulo";
import { criarModuloRelatorios } from "./modules/relatorios/modulo";
import { criarModuloNotificacoes } from "./modules/notificacoes/modulo";

/**
 * COMPOSITION ROOT — o único lugar que conhece todas as implementações concretas.
 * Aqui as dependências são injetadas: cada módulo recebe apenas as INTERFACES
 * de que precisa. Trocar uma implementação (ex.: repositório em memória por
 * PostgreSQL, ou o EventBus por RabbitMQ) altera somente este arquivo.
 */
export const criarAplicacao = (opcoes: { relogio?: Relogio; segredoJwt?: string } = {}) => {
  const relogio = opcoes.relogio ?? new RelogioDoSistema();
  const eventos = new EventBusEmMemoria();

  const autenticacao = criarModuloAutenticacao({ segredoJwt: opcoes.segredoJwt ?? process.env.JWT_SEGREDO ?? "dev-segredo-troque", relogio });
  const pessoas = criarModuloPessoas();
  const imoveis = criarModuloImoveis();
  const contratos = criarModuloContratos({ imoveis: imoveis.api, pessoas: pessoas.api, eventos, relogio });
  const financeiro = criarModuloFinanceiro({ eventos, relogio });
  const relatorios = criarModuloRelatorios({ eventos });
  const notificacoes = criarModuloNotificacoes({ eventos, pessoas: pessoas.api });

  const app = express();
  app.use(express.json());
  const auth = autenticacao.api;
  app.get("/saude", (_req, res) => res.json({ status: "ok" }));
  app.use("/auth", autenticacao.rotasLogin);
  app.use("/usuarios", exigirPerfil(auth, "ADMIN"), autenticacao.rotasUsuarios);
  app.use("/pessoas", exigirPerfil(auth, "ADMIN", "CORRETOR"), pessoas.rotas);
  app.use("/imoveis", exigirPerfil(auth, "ADMIN", "CORRETOR"), imoveis.rotas);
  app.use("/contratos", exigirPerfil(auth, "ADMIN", "CORRETOR"), contratos.rotas);
  app.use("/financeiro", exigirPerfil(auth, "ADMIN", "FINANCEIRO"), financeiro.rotas);
  app.use("/relatorios", exigirPerfil(auth), relatorios.rotas);

  return { app, eventos, modulos: { autenticacao, pessoas, imoveis, contratos, financeiro, relatorios, notificacoes } };
};
