import { Router } from "express";
import { tratar } from "../../../http/tratar";
import type { ContratoId } from "../../../shared/ids";
import type { ContratosServico } from "../application/contratos.servico";

export const rotasContratos = (servico: ContratosServico): Router => {
  const r = Router();
  r.get("/", tratar(async () => servico.listar()));
  r.get("/:id", tratar(async (req) => servico.obter(req.params.id as ContratoId)));
  r.post("/", tratar(async (req) => servico.criar(req.body), 201));
  r.post("/:id/ativar", tratar(async (req) => servico.ativar(req.params.id as ContratoId)));
  r.post("/:id/encerrar", tratar(async (req) => servico.encerrar(req.params.id as ContratoId, req.body?.motivo)));
  return r;
};
