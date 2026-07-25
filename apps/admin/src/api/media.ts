let uploadController: AbortController | null = null;

export type UploadProgress = {
  stage: 'converting' | 'uploading' | 'done' | 'error' | 'cancelled';
  percent: number;
  message: string;
};

export type UploadStateListener = (progress: UploadProgress) => void;
let uploadListeners: UploadStateListener[] = [];

export function onUploadProgress(listener: UploadStateListener) {
  uploadListeners.push(listener);
  return () => {
    uploadListeners = uploadListeners.filter((l) => l !== listener);
  };
}

function notifyProgress(p: UploadProgress) {
  for (const listener of uploadListeners) listener(p);
}

export function cancelUpload() {
  if (uploadController) {
    uploadController.abort();
    uploadController = null;
    notifyProgress({ stage: 'cancelled', percent: 0, message: 'Upload скасовано.' });
  }
}

export async function webpVariants(
  file: File,
  signal?: AbortSignal,
): Promise<{ variant480: Blob; variant960: Blob; variant1600: Blob }> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new Error('Підтримуються JPEG, PNG та WebP.');
  if (file.size > 20 * 1024 * 1024) throw new Error('Оригінал не може перевищувати 20 MB.');

  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  const source = await createImageBitmap(file);

  try {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    const variants = [480, 960, 1600] as const;
    const results = await Promise.all(
      variants.map(async (max) => {
        const scale = Math.min(1, max / source.width);
        const width = Math.max(1, Math.round(source.width * scale));
        const height = Math.max(1, Math.round(source.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas недоступний.');
        context.drawImage(source, 0, 0, width, height);
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/webp', 0.84),
        );
        if (!blob) throw new Error('Не вдалося створити WebP variant.');
        return blob;
      }),
    );

    return {
      variant480: results[0]!,
      variant960: results[1]!,
      variant1600: results[2]!,
    };
  } finally {
    source.close();
  }
}

export async function uploadMedia(
  file: File,
  altUk: string,
  folder = '',
  keepOriginal = false,
): Promise<{ id: string }> {
  uploadController = new AbortController();
  const signal = uploadController.signal;

  notifyProgress({ stage: 'converting', percent: 0, message: 'Конвертація у WebP…' });

  const variants = await webpVariants(file, signal);

  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

  notifyProgress({ stage: 'uploading', percent: 30, message: 'Завантаження variants…' });

  const form = new FormData();
  form.set('altUk', altUk);
  if (folder) form.set('folder', folder);
  form.set('variant480', variants.variant480, 'variant-480.webp');
  form.set('variant960', variants.variant960, 'variant-960.webp');
  form.set('variant1600', variants.variant1600, 'variant-1600.webp');

  // Attach original if configured
  if (keepOriginal) {
    const uniqueName = `original-${Date.now()}-${file.name}`;
    form.set('original', file, uniqueName);
    form.set('originalMime', file.type);
  }

  const response = await fetch('/api/admin/media', {
    method: 'POST',
    body: form,
    signal,
  });

  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

  const json = (await response.json()) as {
    ok: boolean;
    data?: { id: string };
    error?: { message: string };
  };

  if (!response.ok || !json.ok) {
    notifyProgress({
      stage: 'error',
      percent: 0,
      message: json.error?.message ?? 'Upload не вдався.',
    });
    throw new Error(json.error?.message ?? 'Upload не вдався.');
  }

  notifyProgress({ stage: 'done', percent: 100, message: 'Файл завантажено.' });
  uploadController = null;
  return json.data!;
}
