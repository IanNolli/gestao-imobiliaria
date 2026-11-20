import { Dinheiro } from "../../../shared/dinheiro";
import { diasEntre } from "../../../shared/datas";

export interface PoliticaEncargos {
  multaPercentual: number;       // aplicada uma vez após o vencimento
  jurosMensalPercentual: number; // pro rata dia (mês comercial de 30 dias)
}

export const POLITICA_PADRAO: PoliticaEncargos = { multaPercentual: 10, jurosMensalPercentual: 1 };

/**
 * ÚNICO lugar do sistema que sabe calcular multa e juros por atraso.
 * Se Relatórios ou Notificações recalculassem, haveria conascência de ALGORITMO
 * entre módulos (mudar a regra exigiria mudar todos). Os demais módulos recebem
 * o valor pronto no evento PagamentoRegistrado.
 */
export class CalculadoraEncargos {
  constructor(private readonly politica: PoliticaEncargos = POLITICA_PADRAO) {}

  calcular(valor: Dinheiro, vencimento: Date, pagamento: Date): Dinheiro {
    const diasAtraso = diasEntre(vencimento, pagamento);
    if (diasAtraso <= 0) return Dinheiro.zero();
    const multa = valor.percentual(this.politica.multaPercentual);
    const juros = Dinheiro.deCentavos(Math.round((valor.centavos * this.politica.jurosMensalPercentual * diasAtraso) / (100 * 30)));
    return multa.somar(juros);
  }
}
