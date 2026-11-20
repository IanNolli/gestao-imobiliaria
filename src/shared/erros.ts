export class ErroDeNegocio extends Error {
  readonly status: number = 422;
}

export class NaoEncontrado extends Error {
  readonly status: number = 404;
  constructor(recurso: string, id: string) {
    super(`${recurso} '${id}' não encontrado`);
  }
}
