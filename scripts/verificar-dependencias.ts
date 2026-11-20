/**
 * FITNESS FUNCTION de arquitetura (Richards & Ford): verificação automática das
 * regras de acoplamento. Falha (exit 1) se:
 *   1) um módulo importar algo INTERNO de outro módulo (só `modules/<x>/api` é permitido);
 *   2) existir ciclo de dependência entre módulos.
 * Também imprime a matriz de dependências e as métricas Ca, Ce e Instabilidade.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

const raiz = resolve(import.meta.dirname, "..", "src", "modules");
const modulos = readdirSync(raiz).filter((d) => statSync(join(raiz, d)).isDirectory()).sort();
const arquivos = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? arquivos(join(dir, n)) : n.endsWith(".ts") ? [join(dir, n)] : []));

const violacoes: string[] = [];
const deps = new Map<string, Set<string>>(modulos.map((m) => [m, new Set()]));

for (const origem of modulos) {
  for (const arq of arquivos(join(raiz, origem))) {
    const texto = readFileSync(arq, "utf8");
    for (const [, caminho] of texto.matchAll(/from\s+["'](\.[^"']+)["']/g)) {
      const alvo = resolve(dirname(arq), caminho);
      if (!alvo.startsWith(raiz + sep)) continue; // shared/ e http/ são permitidos
      const [modAlvo, ...resto] = relative(raiz, alvo).split(sep);
      if (modAlvo === origem) continue;
      deps.get(origem)!.add(modAlvo);
      if (resto.join("/") !== "api") violacoes.push(`${relative(raiz, arq)} importa '${caminho}' — use apenas modules/${modAlvo}/api`);
    }
  }
}

// detecção de ciclos (DFS)
const ciclos: string[] = [];
const visitar = (m: string, pilha: string[]) => {
  if (pilha.includes(m)) return void ciclos.push([...pilha.slice(pilha.indexOf(m)), m].join(" → "));
  for (const d of deps.get(m) ?? []) visitar(d, [...pilha, m]);
};
modulos.forEach((m) => visitar(m, []));

console.log("\nMatriz de dependências (linha depende de coluna via api/):\n");
console.log("".padEnd(14) + modulos.map((m) => m.slice(0, 6).padEnd(8)).join(""));
for (const m of modulos) console.log(m.padEnd(14) + modulos.map((d) => (deps.get(m)!.has(d) ? "X" : "·").padEnd(8)).join(""));

console.log("\nMétricas (Ca = acoplamento aferente, Ce = eferente, I = Ce/(Ca+Ce)):\n");
for (const m of modulos) {
  const ce = deps.get(m)!.size;
  const ca = modulos.filter((o) => deps.get(o)!.has(m)).length;
  const inst = ca + ce === 0 ? "—" : (ce / (ca + ce)).toFixed(2);
  console.log(`  ${m.padEnd(14)} Ca=${ca}  Ce=${ce}  I=${inst}`);
}

if (violacoes.length || ciclos.length) {
  console.error("\n❌ Regras de arquitetura violadas:");
  [...violacoes, ...ciclos.map((c) => `ciclo: ${c}`)].forEach((v) => console.error("  - " + v));
  process.exit(1);
}
console.log("\n✅ Nenhuma violação: módulos só se comunicam pelas interfaces públicas e não há ciclos.\n");
