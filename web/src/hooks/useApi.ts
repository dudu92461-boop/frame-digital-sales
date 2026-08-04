import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError } from '@/services/api';

type Params = Record<string, string | number | boolean | undefined | null>;

interface Result<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * GET com controle de estado. Aceita `params` como objeto: a comparacao e feita
 * pelo conteudo serializado, entao nao e preciso memoizar o objeto no chamador.
 */
export function useApi<T>(path: string | null, params?: Params): Result<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const key = JSON.stringify(params ?? {});
  // Evita aplicar a resposta de uma requisicao antiga sobre uma mais recente.
  const requestId = useRef(0);

  useEffect(() => {
    if (!path) {
      setData(null);
      setLoading(false);
      return;
    }

    const id = ++requestId.current;
    setLoading(true);
    setError(null);

    api
      .get<T>(path, JSON.parse(key))
      .then((result) => {
        if (id === requestId.current) setData(result);
      })
      .catch((err) => {
        if (id !== requestId.current) return;
        setError(err instanceof ApiError ? err.message : 'Falha ao carregar os dados.');
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
  }, [path, key, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { data, loading, error, reload };
}

/** Busca com atraso, para nao disparar uma requisicao por tecla digitada. */
export function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
