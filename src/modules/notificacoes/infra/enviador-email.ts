import type { EnviadorEmail } from "../application/notificacoes.servico";

/** Adaptador do protótipo: registra o e-mail no console. Trocar por SMTP/SendGrid não afeta nenhum outro módulo. */
export class EnviadorEmailConsole implements EnviadorEmail {
  readonly enviados: { para: string; assunto: string; corpo: string }[] = [];
  async enviar(para: string, assunto: string, corpo: string): Promise<void> {
    this.enviados.push({ para, assunto, corpo });
    if (process.env.NODE_ENV !== "test") console.log(`[e-mail] para=${para} | ${assunto} | ${corpo}`);
  }
}
