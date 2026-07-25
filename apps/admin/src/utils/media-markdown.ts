export type MediaImage = {
  url: string;
  alt?: string | null;
  altUk?: string | null;
  altEn?: string | null;
  originalFilename?: string | null;
  filename?: string | null;
};

/**
 * Milkdown Crepe image-block stores the aspect ratio in alt and the
 * description in title.  We output `![](url "desc")` so the description
 * lands in caption instead of being parsed as a broken ratio number.
 */
export function buildImageMarkdown(image: MediaImage): string {
  const caption = getImageAlt(image);
  const escaped = escapeMarkdownTitle(caption);
  return `![](${image.url}${escaped ? ` "${escaped}"` : ''})`;
}

function getImageAlt(image: MediaImage): string {
  if (image.alt?.trim()) {
    return image.alt.trim();
  }
  if (image.altUk?.trim()) {
    return image.altUk.trim();
  }
  if (image.altEn?.trim()) {
    return image.altEn.trim();
  }

  const filename = image.originalFilename || image.filename || extractNameFromUrl(image.url);
  return filename.replace(/\.[^.]+$/, '');
}

function extractNameFromUrl(url: string): string {
  const lastSegment = url.split('/').pop() ?? '';
  // Strip hash prefix and size suffix, e.g. 7d991b...4260-960.webp → webp image
  return lastSegment.replace(/^[a-f0-9]{64}-/, '').replace(/\.webp$/, '') || 'зображення';
}

function escapeMarkdownTitle(value: string): string {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('"', '\\"');
}

export function isValidMediaUrl(url: string): boolean {
  if (!url.startsWith('/media/')) {
    return false;
  }

  if (url.includes('..')) {
    return false;
  }

  if (/[\u0000-\u001F\u007F]/.test(url)) {
    return false;
  }

  return true;
}

function copyTextFallback(value: string): boolean {
  const textarea = document.createElement('textarea');

  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '0';

  document.body.appendChild(textarea);
  textarea.select();

  try {
    return document.execCommand('copy');
  } finally {
    document.body.removeChild(textarea);
  }
}

export async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  if (!copyTextFallback(value)) {
    throw new Error('Failed to copy text');
  }
}

export async function copyImageMarkdown(image: MediaImage): Promise<string> {
  if (!isValidMediaUrl(image.url)) {
    throw new Error('Invalid internal media URL');
  }

  const markdown = buildImageMarkdown(image);

  await copyText(markdown);

  return markdown;
}
