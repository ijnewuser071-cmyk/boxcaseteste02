export type ServiceResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export const serviceUnavailable = <T>(): ServiceResult<T> => ({
  data: null,
  error: "Supabase ainda não está configurado.",
});
