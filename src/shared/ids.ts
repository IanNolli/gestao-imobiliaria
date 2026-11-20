import { randomUUID } from "node:crypto";

/**
 * IDs tipados ("branded types"). Um PessoaId não pode ser passado onde se espera
 * um ImovelId, mesmo ambos sendo strings. Isso reduz a conascência de POSIÇÃO
 * (trocar argumentos de lugar) para conascência de TIPO, detectada em compilação.
 */
type Marca<T, M extends string> = T & { readonly __marca: M };

export type ImovelId = Marca<string, "ImovelId">;
export type PessoaId = Marca<string, "PessoaId">;
export type ContratoId = Marca<string, "ContratoId">;
export type CobrancaId = Marca<string, "CobrancaId">;
export type UsuarioId = Marca<string, "UsuarioId">;

export const novoId = <T extends string>(prefixo: string): T => `${prefixo}_${randomUUID().slice(0, 8)}` as T;
