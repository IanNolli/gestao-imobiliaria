import type { NextFunction, Request, Response } from "express";
import type { AutenticacaoApi, Perfil } from "../modules/autenticacao/api";

/**
 * Autorização aplicada na COMPOSIÇÃO das rotas, não dentro dos módulos.
 * Assim Imóveis, Contratos, Financeiro... não dependem do módulo de Autenticação.
 */
export const exigirPerfil = (auth: AutenticacaoApi, ...perfis: Perfil[]) => (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "") ?? "";
  const sessao = token ? auth.verificarToken(token) : null;
  if (!sessao) return res.status(401).json({ erro: "Não autenticado" });
  if (perfis.length > 0 && !perfis.includes(sessao.perfil)) return res.status(403).json({ erro: "Sem permissão" });
  (req as any).sessao = sessao;
  next();
};
