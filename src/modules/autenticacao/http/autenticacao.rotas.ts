import { Router } from "express";
import { tratar } from "../../../http/tratar";
import type { AutenticacaoServico } from "../application/autenticacao.servico";

export const rotasAutenticacao = (servico: AutenticacaoServico): Router => {
  const r = Router();
  r.post("/login", tratar(async (req) => servico.login(req.body?.email, req.body?.senha)));
  return r;
};

export const rotasUsuarios = (servico: AutenticacaoServico): Router => {
  const r = Router();
  r.post("/", tratar(async (req) => servico.cadastrar(req.body?.email, req.body?.senha, req.body?.perfil), 201));
  return r;
};
