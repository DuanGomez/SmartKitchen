import { environment } from '../../../environments/environment';

/** URL de la foto de un producto: archivo subido al backend o data URL (modo demo). */
export function productImageUrl(imagen: string | null | undefined): string | null {
  if (!imagen) return null;
  if (/^(https?:|data:)/.test(imagen)) return imagen;
  return environment.uploadsUrl + imagen;
}
