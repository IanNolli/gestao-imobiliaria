import { Router } from "express";
import { tratar } from "../../../http/tratar";
import type { ImoveisServico } from "../application/imoveis.servico";

export const rotasImoveis = (servico: ImoveisServico): Router => {
  const r = Router();
  r.get("/", tratar(async () => servico.listar()));
  r.post("/", tratar(async (req) => servico.cadastrar(req.body), 201));
  return r;
};
