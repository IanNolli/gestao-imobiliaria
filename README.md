# Sistema de Gestão Imobiliária — Protótipo Arquitetural

Trabalho de **Arquitetura de Software** (Uni-FACEF, 6º semestre, prof. Carlos Alberto Lucas).
Sistema nº 11: gestão de **imóveis, contratos de locação e recebimentos**.

**Integrantes:** Ian Nolli, Luis Felipe Ferracine e Julio Pimentel Ribeiro.

O foco deste repositório é **materializar a arquitetura** descrita no documento arquitetural:
um **monólito modular** com módulos de alta coesão, comunicação somente por interfaces
públicas e eventos de domínio, e regras de acoplamento verificadas automaticamente.

## Como executar

```bash
npm install
npm test                         # 9 testes: domínio, fluxo completo de locação e API HTTP
npm run verificar:dependencias   # fitness function: matriz de dependências + métricas Ca/Ce/I
npm run typecheck
npm start                        # API em http://localhost:3000
```

Login inicial: `POST /auth/login` com `{"email":"admin@imobiliaria.com","senha":"admin12345"}`.
Use o token retornado no cabeçalho `Authorization: Bearer <token>`.

## Estrutura

```
src/
├── shared/                 # shared kernel: Dinheiro, IDs tipados, EventBus, Relógio, erros
├── http/                   # adaptação HTTP comum + autorização por perfil
├── app.ts                  # COMPOSITION ROOT (injeção de dependências)
├── main.ts
└── modules/
    ├── autenticacao/       # usuários, perfis, JWT
    ├── pessoas/            # proprietários, inquilinos, fiadores
    ├── imoveis/            # cadastro e disponibilidade
    ├── contratos/          # ciclo de vida do contrato de locação
    ├── financeiro/         # cobranças, pagamentos, multa/juros, repasse
    ├── relatorios/         # modelo de leitura alimentado por eventos
    └── notificacoes/       # avisos por e-mail
```

Cada módulo segue a mesma organização interna:

| Pasta | Responsabilidade |
|---|---|
| `api/` | **Contrato público** (interface/facade e tipos dos eventos). Único ponto que outros módulos podem importar. |
| `domain/` | Entidades, regras de negócio e interfaces de repositório (portas). |
| `application/` | Casos de uso; orquestram o domínio e publicam eventos. |
| `infra/` | Implementações concretas (repositórios em memória no protótipo). |
| `http/` | Rotas REST do módulo. |
| `modulo.ts` | Montagem do módulo, usada só pela composition root. |

## Dependências entre módulos

| Módulo | Depende de (via `api/`) | Ca | Ce | Instabilidade |
|---|---|---|---|---|
| imoveis | — | 1 | 0 | 0,00 |
| pessoas | — | 2 | 0 | 0,00 |
| financeiro | contratos (eventos) | 2 | 1 | 0,33 |
| contratos | imoveis, pessoas | 2 | 2 | 0,50 |
| relatorios | contratos, financeiro (eventos) | 0 | 2 | 1,00 |
| notificacoes | financeiro (eventos), pessoas | 0 | 2 | 1,00 |
| autenticacao | — (usado só pela camada HTTP) | 0 | 0 | — |

Os módulos estáveis (Imóveis, Pessoas) ficam no núcleo, e os voláteis (Relatórios, Notificações) nas bordas.
O script `scripts/verificar-dependencias.ts` falha se alguém importar a parte interna de outro módulo ou criar um ciclo.

## Onde encontrar cada decisão no código

| Decisão (documento) | Arquivo |
|---|---|
| Comunicação síncrona só onde a consistência é imediata | `modules/contratos/application/contratos.servico.ts` (`ativar`) |
| Eventos de domínio assíncronos | `shared/eventos.ts`, `modules/*/api/index.ts` |
| Conascência de posição → nome (parâmetros nomeados) | `modules/contratos/domain/contrato.ts` (`DadosNovoContrato`) |
| Conascência de posição/convenção → tipo (IDs tipados, Dinheiro) | `shared/ids.ts`, `shared/dinheiro.ts` |
| Conascência de algoritmo eliminada (multa/juros num lugar só) | `modules/financeiro/domain/calculadora-encargos.ts` |
| Conascência temporal reduzida (eventos + Relógio injetável) | `shared/eventos.ts`, `shared/relogio.ts` |
| Read model (CQRS leve) | `modules/relatorios/application/relatorios.projecao.ts` |
| Injeção de dependências / DIP | `src/app.ts` |
| Fitness function de acoplamento | `scripts/verificar-dependencias.ts` |

Os fontes dos diagramas C4 (Graphviz) estão em `docs/diagramas/`. Para gerar as imagens: `dot -Tpng docs/diagramas/c3-componentes.dot -o c3.png`. As imagens também estão no documento arquitetural.

## Limitações do protótipo

- A persistência é em memória. No sistema real, cada módulo teria um schema próprio no PostgreSQL.
- O barramento de eventos roda dentro do processo. Para extrair módulos em serviços: Outbox + RabbitMQ/Kafka.
- A integração com banco/PIX e o front-end SPA não foram implementados.
