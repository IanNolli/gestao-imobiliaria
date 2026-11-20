import type { EventBus } from "../../shared/eventos";
import type { PessoasApi } from "../pessoas/api";
import { NotificacoesServico, type EnviadorEmail } from "./application/notificacoes.servico";
import { EnviadorEmailConsole } from "./infra/enviador-email";

export const criarModuloNotificacoes = <E extends EnviadorEmail = EnviadorEmailConsole>(deps: { eventos: EventBus; pessoas: PessoasApi; email?: E }) => {
  const email = (deps.email ?? new EnviadorEmailConsole()) as E;
  const servico = new NotificacoesServico(deps.pessoas, email);
  servico.assinarEventos(deps.eventos);
  return { servico, email };
};
