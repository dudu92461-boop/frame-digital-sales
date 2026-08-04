/**
 * Preparo da foto de perfil no navegador.
 *
 * A foto que o usuario escolhe costuma ter varios megabytes; o avatar aparece
 * em 44px. Redimensionar antes do envio mantem o corpo da requisicao pequeno e
 * o banco enxuto. O recorte e quadrado e centralizado, que e como o avatar e
 * exibido em todo o sistema.
 *
 * O servidor revalida formato e tamanho: isto aqui e conveniencia, nao defesa.
 */

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB de arquivo original
const OUTPUT_SIZE = 256;
const OUTPUT_QUALITY = 0.85;

export class ImageError extends Error {}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new ImageError('Nao foi possivel ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new ImageError('O arquivo nao parece ser uma imagem valida.'));
    image.src = dataUrl;
  });
}

/**
 * Le a imagem escolhida, recorta no centro em formato quadrado, reduz para
 * 256x256 e devolve uma data URL JPEG pronta para enviar a API.
 */
export async function prepareAvatar(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new ImageError('Selecione um arquivo de imagem.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ImageError('A imagem deve ter no maximo 8 MB.');
  }

  const image = await loadImage(await readAsDataUrl(file));

  // Recorte quadrado a partir do centro, para nao distorcer o rosto.
  const side = Math.min(image.width, image.height);
  const sx = (image.width - side) / 2;
  const sy = (image.height - side) / 2;

  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;

  const context = canvas.getContext('2d');
  if (!context) throw new ImageError('Nao foi possivel processar a imagem.');

  context.imageSmoothingQuality = 'high';
  context.drawImage(image, sx, sy, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

  // JPEG achata a transparencia em preto; pintar branco antes evita fundo escuro
  // em PNGs com fundo transparente.
  const output = document.createElement('canvas');
  output.width = OUTPUT_SIZE;
  output.height = OUTPUT_SIZE;
  const outputContext = output.getContext('2d');
  if (!outputContext) throw new ImageError('Nao foi possivel processar a imagem.');
  outputContext.fillStyle = '#ffffff';
  outputContext.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  outputContext.drawImage(canvas, 0, 0);

  return output.toDataURL('image/jpeg', OUTPUT_QUALITY);
}
