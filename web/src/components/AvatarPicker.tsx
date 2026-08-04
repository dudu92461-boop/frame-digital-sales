import { useRef, useState } from 'react';
import { Camera, Trash2, Upload } from 'lucide-react';
import { Avatar, Spinner, cx } from '@/components/ui';
import { ImageError, prepareAvatar } from '@/utils/image';

const COLORS = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#e11d48', '#0369a1', '#0f172a'];

/**
 * Escolha da foto de perfil, com as cores das iniciais como alternativa.
 *
 * `photoUrl` null significa "sem foto" (mostra as iniciais). O componente nao
 * fala com a API: devolve a data URL pronta e quem usa decide quando salvar.
 */
export function AvatarPicker({
  name,
  photoUrl,
  color,
  onPhotoChange,
  onColorChange,
}: {
  name: string;
  photoUrl: string | null;
  color: string;
  onPhotoChange: (dataUrl: string | null) => void;
  onColorChange?: (color: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const pickFile = async (file?: File) => {
    if (!file) return;
    setProcessing(true);
    setError('');
    try {
      onPhotoChange(await prepareAvatar(file));
    } catch (err) {
      setError(err instanceof ImageError ? err.message : 'Falha ao processar a imagem.');
    } finally {
      setProcessing(false);
      // Permite escolher o mesmo arquivo de novo apos remover.
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <Avatar name={name || '?'} color={color} photoUrl={photoUrl} size="xl" />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={processing}
            className="absolute -bottom-1 -right-1 grid place-items-center w-7 h-7 rounded-full
                       bg-brand-600 text-white shadow-raised border-2 border-white
                       hover:bg-brand-700 disabled:opacity-60"
            aria-label="Escolher foto"
          >
            {processing ? <Spinner className="w-3 h-3" /> : <Camera className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => inputRef.current?.click()}
              disabled={processing}
            >
              <Upload className="w-3.5 h-3.5" />
              {photoUrl ? 'Trocar foto' : 'Enviar foto'}
            </button>

            {photoUrl && (
              <button
                type="button"
                className="btn-ghost btn-sm text-alert-600 hover:bg-alert-50"
                onClick={() => {
                  onPhotoChange(null);
                  setError('');
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remover
              </button>
            )}
          </div>

          <p className="mt-2 text-2xs text-slate-500 leading-relaxed">
            JPG, PNG ou WebP, ate 8 MB. A imagem e recortada em quadrado e reduzida
            automaticamente antes do envio.
          </p>

          {/* As cores so aparecem quando nao ha foto: e o que sera exibido. */}
          {!photoUrl && onColorChange && (
            <div className="mt-3">
              <p className="text-2xs font-medium text-slate-600 mb-1.5">Cor das iniciais</p>
              <div className="flex flex-wrap gap-1.5">
                {COLORS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onColorChange(option)}
                    className={cx(
                      'w-6 h-6 rounded-full border-2 transition-transform hover:scale-110',
                      color === option ? 'border-slate-900' : 'border-transparent',
                    )}
                    style={{ backgroundColor: option }}
                    aria-label={`Cor ${option}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {error && <p className="field-error mt-2">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => pickFile(e.target.files?.[0])}
      />
    </div>
  );
}
