import { Router } from "express";
import { tratar } from "../../../http/tratar";
import type { CobrancaId, ContratoId } from "../../../shared/ids";
import type { FinanceiroServico } from "../application/financeiro.servico";

export const rotasFinanceiro = (servico: FinanceiroServico): Router => {
  const r = Router();
  r.get("/cobrancas", tratar(async (req) => servico.listar(req.query.contratoId as ContratoId | undefined)));
  r.post("/cobrancas/:id/pagamentos", tratar(async (req) => servico.registrarPagamento(req.params.id as CobrancaId, req.body?.pagoEm, req.body?.valorPago)));
  r.post("/rotinas/marcar-vencidas", tratar(async () => ({ marcadas: await servico.marcarVencidas() })));
  return r;
};
