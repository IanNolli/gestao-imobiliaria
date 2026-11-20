/**
 * Value Object de dinheiro. Guarda o valor em CENTAVOS (inteiro).
 *
 * Conascência: substitui a convenção implícita "number em reais? em centavos?"
 * (conascência de significado/convenção entre módulos) por um TIPO explícito
 * (conascência de tipo), que o compilador verifica.
 */
export class Dinheiro {
  private constructor(public readonly centavos: number) {
    if (!Number.isInteger(centavos)) throw new Error("Dinheiro deve ser representado em centavos inteiros");
  }

  static deCentavos(centavos: number): Dinheiro {
    return new Dinheiro(centavos);
  }

  static deReais(reais: number): Dinheiro {
    return new Dinheiro(Math.round(reais * 100));
  }

  static zero(): Dinheiro {
    return new Dinheiro(0);
  }

  somar(outro: Dinheiro): Dinheiro {
    return new Dinheiro(this.centavos + outro.centavos);
  }

  subtrair(outro: Dinheiro): Dinheiro {
    return new Dinheiro(this.centavos - outro.centavos);
  }

  /** Aplica um percentual (ex.: 10 = 10%) com arredondamento para o centavo. */
  percentual(p: number): Dinheiro {
    return new Dinheiro(Math.round((this.centavos * p) / 100));
  }

  emReais(): number {
    return this.centavos / 100;
  }

  toJSON(): number {
    return this.emReais();
  }
}
