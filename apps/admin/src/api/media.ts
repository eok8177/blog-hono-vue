export async function webpVariants(
  file: File,
): Promise<{ variant480: Blob; variant960: Blob; variant1600: Blob }> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new Error('Підтримуються JPEG, PNG та WebP.');
  if (file.size > 20 * 1024 * 1024) throw new Error('Оригінал не може перевищувати 20 MB.');
  const source = await createImageBitmap(file);
  const make = async (max: number) => {
    const scale = Math.min(1, max / source.width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(source.width * scale));
    canvas.height = Math.max(1, Math.round(source.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas недоступний.');
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', 0.84),
    );
    if (!blob) throw new Error('Не вдалося створити WebP variant.');
    return blob;
  };
  try {
    return {
      variant480: await make(480),
      variant960: await make(960),
      variant1600: await make(1600),
    };
  } finally {
    source.close();
  }
}
export async function uploadMedia(file: File, altUk: string, folder = '') {
  const variants = await webpVariants(file);
  const form = new FormData();
  form.set('altUk', altUk);
  if (folder) form.set('folder', folder);
  form.set('variant480', variants.variant480, 'variant-480.webp');
  form.set('variant960', variants.variant960, 'variant-960.webp');
  form.set('variant1600', variants.variant1600, 'variant-1600.webp');
  const response = await fetch('/api/admin/media', { method: 'POST', body: form });
  const json = (await response.json()) as { ok: boolean; error?: { message: string } };
  if (!response.ok || !json.ok) throw new Error(json.error?.message ?? 'Upload не вдався.');
  return json;
}
