/** Utilidades de data restritas ao domínio de locação (datas sem horário, em UTC). */
export const diaUtc = (iso: string): Date => new Date(`${iso.slice(0, 10)}T00:00:00.000Z`);
export const isoDia = (d: Date): string => d.toISOString().slice(0, 10);
export const diasEntre = (inicio: Date, fim: Date): number =>
  Math.floor((diaUtc(isoDia(fim)).getTime() - diaUtc(isoDia(inicio)).getTime()) / 86_400_000);
