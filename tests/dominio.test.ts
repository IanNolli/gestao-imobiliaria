import { test } from "node:test";
import assert from "node:assert/strict";
import { Dinheiro } from "../src/shared/dinheiro";
import { CalculadoraEncargos } from "../src/modules/financeiro/domain/calculadora-encargos";

test("Dinheiro trabalha em centavos e arredonda percentuais", () => {
  assert.equal(Dinheiro.deReais(1500.5).centavos, 150050);
  assert.equal(Dinheiro.deReais(1000).percentual(8).emReais(), 80);
});

test("Encargos: pagamento em dia não gera multa nem juros", () => {
  const calc = new CalculadoraEncargos({ multaPercentual: 10, jurosMensalPercentual: 1 });
  assert.equal(calc.calcular(Dinheiro.deReais(1500), new Date("2027-01-10"), new Date("2027-01-10")).centavos, 0);
});

test("Encargos: 15 dias de atraso = 10% multa + 0,5% juros", () => {
  const calc = new CalculadoraEncargos({ multaPercentual: 10, jurosMensalPercentual: 1 });
  // 1500 * 10% = 150,00 ; 1500 * 1% * 15/30 = 7,50
  assert.equal(calc.calcular(Dinheiro.deReais(1500), new Date("2027-01-10"), new Date("2027-01-25")).emReais(), 157.5);
});
