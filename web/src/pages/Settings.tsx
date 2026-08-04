import { useState, type FormEvent } from 'react';
import { KeyRound, UserRound } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { api, ApiError } from '@/services/api';
import { PageHeader } from '@/components/PageHeader';
import { Alert, Field, Spinner } from '@/components/ui';
import { AvatarPicker } from '@/components/AvatarPicker';
import { dateTime } from '@/utils/format';

function ProfileSection() {
  const { user, refresh } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor ?? '#2563eb');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl ?? null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.patch('/auth/profile', {
        name,
        phone: phone || undefined,
        avatarColor,
        avatarUrl, // null remove a foto
      });
      await refresh();
      toast('Perfil atualizado.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao salvar o perfil.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <section className="panel">
      <div className="panel-header">
        <h2 className="panel-title flex items-center gap-1.5">
          <UserRound className="w-3.5 h-3.5 text-slate-400" />
          Meu perfil
        </h2>
      </div>

      <form onSubmit={submit} className="p-4 space-y-3 max-w-lg">
        {error && <Alert message={error} />}

        <AvatarPicker
          name={name || user.name}
          photoUrl={avatarUrl}
          color={avatarColor}
          onPhotoChange={setAvatarUrl}
          onColorChange={setAvatarColor}
        />

        <Field label="Nome" required>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>

        <Field label="Telefone">
          <input
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(51) 99999-9999"
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="E-mail" hint="O e-mail de acesso e alterado pelo administrador.">
            <input className="input" value={user.email} disabled />
          </Field>

          {user.seller && (
            <Field label="Codigo de vendedor">
              <input className="input font-mono" value={user.seller.code} disabled />
            </Field>
          )}
        </div>

        <div className="pt-1">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving && <Spinner className="w-3.5 h-3.5" />}
            Salvar perfil
          </button>
        </div>
      </form>
    </section>
  );
}

function PasswordSection() {
  const { toast } = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (next !== confirm) {
      setError('A confirmacao nao confere com a nova senha.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post('/auth/change-password', { currentPassword: current, newPassword: next });
      toast('Senha alterada.');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao alterar a senha.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h2 className="panel-title flex items-center gap-1.5">
          <KeyRound className="w-3.5 h-3.5 text-slate-400" />
          Alterar senha
        </h2>
      </div>

      <form onSubmit={submit} className="p-4 space-y-3 max-w-lg">
        {error && <Alert message={error} />}

        <Field label="Senha atual" required>
          <input
            type="password"
            className="input"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
            autoComplete="current-password"
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Nova senha" required hint="Minimo de 8 caracteres.">
            <input
              type="password"
              className="input"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              minLength={8}
              required
              autoComplete="new-password"
            />
          </Field>

          <Field label="Confirmar nova senha" required>
            <input
              type="password"
              className="input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={8}
              required
              autoComplete="new-password"
            />
          </Field>
        </div>

        <div className="pt-1">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving && <Spinner className="w-3.5 h-3.5" />}
            Alterar senha
          </button>
        </div>
      </form>
    </section>
  );
}

export function SettingsPage() {
  const { user } = useAuth();

  return (
    <>
      <PageHeader
        title="Configuracoes"
        description="Dados da sua conta e seguranca de acesso."
      />

      <div className="space-y-4">
        <ProfileSection />
        <PasswordSection />

        {user?.lastLoginAt && (
          <p className="text-2xs text-slate-500">
            Ultimo acesso: {dateTime(user.lastLoginAt)}
          </p>
        )}
      </div>
    </>
  );
}
