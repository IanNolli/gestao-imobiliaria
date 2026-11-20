import { Router } from "express";
import { tratar } from "../../../http/tratar";
import type { ProjecaoRelatorios } from "../application/relatorios.projecao";

export const rotasRelatorios = (projecao: ProjecaoRelatorios): Router => {
  const r = Router();
  r.get("/resumo", tratar(async () => projecao.resumo()));
  return r;
};
