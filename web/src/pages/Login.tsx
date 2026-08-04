import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { api, ApiError } from '@/services/api';
import { Alert, Field, LoadingBlock, Spinner } from '@/components/ui';

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid place-items-center w-11 h-11 rounded border-2 border-accent-600" aria-hidden>
        <span className="w-3 h-3 bg-accent-600 rounded-sm" />
      </span>
      <div>
        <p className="text-base font-semibold text-white leading-tight">Frame Digital</p>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400 leading-tight">Sales</p>
      </div>
    </div>
  );
}

/** Recuperacao de senha. Sem servico de e-mail, o token aparece na tela em dev. */
function ForgotPassword({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const requestToken = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.post<{ devToken?: string }>('/auth/forgot-password', { email });
      setSent(true);
      if (data.devToken) setToken(data.devToken);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao solicitar a recuperacao.');
    } finally {
      setLoading(false);
    }
  };

  const applyNewPassword = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao redefinir a senha.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="space-y-4">
        <Alert tone="info" message="Senha redefinida. Voce ja pode entrar com a nova senha." />
        <button type="button" className="btn-secondary w-full" onClick={onBack}>
          Voltar para o login
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Voltar para o login
      </button>

      {error && <Alert message={error} />}

      {!sent ? (
        <form onSubmit={requestToken} className="space-y-3">
          <p className="text-xs text-slate-600 leading-relaxed">
            Informe o e-mail cadastrado. Enviaremos as instrucoes para redefinir a sua senha.
          </p>
          <Field label="E-mail" required>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </Field>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading && <Spinner className="w-4 h-4" />}
            Enviar instrucoes
          </button>
        </form>
      ) : (
        <form onSubmit={applyNewPassword} className="space-y-3">
          {token ? (
            <Alert
              tone="warning"
              message="Ambiente de desenvolvimento: nenhum e-mail foi enviado, o token abaixo ja foi preenchido para voce testar o fluxo."
            />
          ) : (
            <Alert tone="info" message="Se o e-mail existir, voce recebera um link de recuperacao." />
          )}

          <Field label="Token de recuperacao" required>
            <input
              type="text"
              className="input font-mono text-xs"
              value={token ?? ''}
              onChange={(e) => setToken(e.target.value)}
              required
            />
          </Field>

          <Field label="Nova senha" required hint="Minimo de 8 caracteres.">
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              autoComplete="new-password"
            />
          </Field>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading && <Spinner className="w-4 h-4" />}
            Redefinir senha
          </button>
        </form>
      )}
    </div>
  );
}

export function Login() {
  const { user, loading: authLoading, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'forgot'>('login');

  if (authLoading) return <LoadingBlock />;
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nao foi possivel entrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Painel de marca: some no celular para dar espaco ao formulario. */}
      <div className="hidden lg:flex flex-col justify-between bg-ink-900 p-10">
        <Brand />
        <div className="max-w-md">
          <h1 className="text-2xl font-semibold text-white leading-snug">
            Painel de vendas da Frame Digital
          </h1>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed">
            Cadastro de leads, acompanhamento de negociacoes, registro de vendas e controle de
            comissoes em um so lugar.
          </p>
        </div>
        <p className="text-2xs text-slate-500">
          Acesso restrito a equipe comercial. Frame Digital {new Date().getFullYear()}.
        </p>
      </div>

      <div className="flex items-center justify-center p-5 sm:p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex justify-center">
            <div className="flex items-center gap-3">
              <span
                className="grid place-items-center w-11 h-11 rounded border-2 border-accent-600"
                aria-hidden
              >
                <span className="w-3 h-3 bg-accent-600 rounded-sm" />
              </span>
              <div>
                <p className="text-base font-semibold text-slate-900 leading-tight">Frame Digital</p>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 leading-tight">
                  Sales
                </p>
              </div>
            </div>
          </div>

          {mode === 'forgot' ? (
            <ForgotPassword onBack={() => setMode('login')} />
          ) : (
            <>
              <h2 className="text-lg font-semibold text-slate-900">Entrar no sistema</h2>
              <p className="mt-1 mb-6 text-xs text-slate-500">
                Use o e-mail e a senha fornecidos pela Frame Digital.
              </p>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {error && <Alert message={error} />}

                <Field label="E-mail" required>
                  <input
                    type="email"
                    className="input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    autoComplete="username"
                  />
                </Field>

                <Field label="Senha" required>
                  <input
                    type="password"
                    className="input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </Field>

                <button type="submit" className="btn-primary w-full h-10" disabled={loading}>
                  {loading && <Spinner className="w-4 h-4" />}
                  Entrar
                </button>

                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="w-full text-center text-xs text-accent-600 hover:underline pt-1"
                >
                  Esqueci minha senha
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
