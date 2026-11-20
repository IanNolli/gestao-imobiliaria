/** Abstração do tempo: torna regras dependentes de data testáveis (reduz conascência temporal nos testes). */
export interface Relogio {
  agora(): Date;
}

export class RelogioDoSistema implements Relogio {
  agora(): Date {
    return new Date();
  }
}

export class RelogioFixo implements Relogio {
  constructor(private atual: Date) {}
  agora(): Date {
    return new Date(this.atual);
  }
  definir(data: Date): void {
    this.atual = data;
  }
}
