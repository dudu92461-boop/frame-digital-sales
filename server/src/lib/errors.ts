export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new AppError(400, message, details);

export const unauthorized = (message = 'Sessao invalida ou expirada.') =>
  new AppError(401, message);

export const forbidden = (message = 'Voce nao tem permissao para esta acao.') =>
  new AppError(403, message);

export const notFound = (message = 'Registro nao encontrado.') => new AppError(404, message);

export const conflict = (message: string) => new AppError(409, message);
