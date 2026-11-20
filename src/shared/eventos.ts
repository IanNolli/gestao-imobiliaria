/**
 * Barramento de eventos de domínio (in-process, assíncrono).
 *
 * Os módulos publicam fatos ("ContratoAtivado") sem saber quem vai reagir.
 * Isso remove dependências diretas entre publicador e consumidores e reduz a
 * conascência TEMPORAL: o publicador não espera o consumidor terminar.
 *
 * Evolução: a mesma interface pode ser implementada sobre RabbitMQ/Kafka
 * (com Outbox) se algum módulo for extraído para um serviço separado.
 */
export interface EventoDeDominio {
  readonly tipo: string;
  readonly versao: number;
  readonly ocorridoEm: string; // ISO-8601
}

export type Manipulador<E extends EventoDeDominio> = (evento: E) => void | Promise<void>;

export interface EventBus {
  publicar(evento: EventoDeDominio): void;
  assinar<E extends EventoDeDominio>(tipo: E["tipo"], manipulador: Manipulador<E>): void;
}

export class EventBusEmMemoria implements EventBus {
  private readonly manipuladores = new Map<string, Manipulador<any>[]>();
  private pendentes = new Set<Promise<void>>();
  readonly historico: EventoDeDominio[] = [];

  publicar(evento: EventoDeDominio): void {
    this.historico.push(evento);
    for (const m of this.manipuladores.get(evento.tipo) ?? []) {
      // Entrega assíncrona: o publicador não depende do tempo de execução do consumidor.
      const p: Promise<void> = new Promise<void>((resolve) => setImmediate(resolve))
        .then(() => m(evento))
        .catch((erro) => console.error(`[eventos] falha ao tratar ${evento.tipo}:`, erro))
        .finally(() => this.pendentes.delete(p));
      this.pendentes.add(p);
    }
  }

  assinar<E extends EventoDeDominio>(tipo: E["tipo"], manipulador: Manipulador<E>): void {
    const lista = this.manipuladores.get(tipo) ?? [];
    lista.push(manipulador);
    this.manipuladores.set(tipo, lista);
  }

  /** Usado em testes: espera até que todos os eventos (inclusive em cascata) sejam processados. */
  async aguardarProcessamento(): Promise<void> {
    while (this.pendentes.size > 0) await Promise.all([...this.pendentes]);
  }
}
