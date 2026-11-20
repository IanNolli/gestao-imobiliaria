import { Router } from "express";
import { tratar } from "../../../http/tratar";
import type { PessoasServico } from "../application/pessoas.servico";

export const rotasPessoas = (servico: PessoasServico): Router => {
  const r = Router();
  r.get("/", tratar(async () => servico.listar()));
  r.post("/", tratar(async (req) => servico.cadastrar(req.body), 201));
  return r;
};
