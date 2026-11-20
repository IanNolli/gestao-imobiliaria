import type { NextFunction, Request, Response } from "express";

/** Adapta um caso de uso assíncrono para um handler Express, padronizando erros. */
export const tratar =
  (fn: (req: Request) => Promise<unknown>, status = 200) =>
  async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const resultado = await fn(req);
      res.status(status).json(resultado ?? { ok: true });
    } catch (erro: any) {
      res.status(erro?.status ?? 500).json({ erro: erro?.message ?? "Erro interno" });
    }
  };
