// AI Platform Launch & Auto-Paste Integration Utility

export const PLATFORMS = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    brand: 'OpenAI',
    prefix: 'Direct & Action-Oriented',
    supportsUrlParam: true,
    getUrl: (prompt) => `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`,
    fallbackUrl: (prompt) => `https://chat.openai.com/?q=${encodeURIComponent(prompt)}`,
    transform: (prompt) => prompt,
    tips: 'Prompt is automatically pre-filled in ChatGPT input and copied to your clipboard.',
  },
  {
    id: 'claude',
    name: 'Claude',
    brand: 'Anthropic',
    prefix: 'XML Tags & Context Framing',
    supportsUrlParam: true,
    getUrl: (prompt) => `https://claude.ai/new?q=${encodeURIComponent(prompt)}`,
    fallbackUrl: () => 'https://claude.ai/new',
    transform: (prompt) => {
      return `<system_context>\nYou are an AI assistant tasked with executing instructions with precision and analytical depth.\n</system_context>\n\n<user_instructions>\n${prompt}\n</user_instructions>\n\n<guidelines>\n- Provide structured, exhaustive analysis.\n- Think carefully before executing.\n</guidelines>`;
    },
    tips: 'Transformed with XML tags, copied to clipboard, and forwarded to Claude.',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    brand: 'Google',
    prefix: 'Multi-Perspective Grounding',
    supportsUrlParam: false,
    getUrl: () => 'https://gemini.google.com/app',
    fallbackUrl: () => 'https://gemini.google.com/app',
    transform: (prompt) => {
      return `[Context & Grounding]\nPlease approach the following task with comprehensive coverage, validating logical edge cases and maintaining clarity.\n\nTask:\n${prompt}\n\nDeliverable Format:\nProvide the core response first, followed by key considerations and alternative approaches if relevant.`;
    },
    tips: 'Copied to clipboard formatted for Gemini. Ready to paste with Ctrl+V / Cmd+V.',
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    brand: 'Search AI',
    prefix: 'Fact-Grounded Search Formulation',
    supportsUrlParam: true,
    getUrl: (prompt) => `https://www.perplexity.ai/search?q=${encodeURIComponent(prompt)}`,
    fallbackUrl: () => 'https://www.perplexity.ai/',
    transform: (prompt) => {
      return `Please provide an in-depth, verified analysis with current authoritative sources on: ${prompt}`;
    },
    tips: 'Query parameter pre-filled and executed automatically in Perplexity.',
  },
  {
    id: 'copilot',
    name: 'Copilot',
    brand: 'Microsoft',
    prefix: 'Productivity & Code Synthesis',
    supportsUrlParam: true,
    getUrl: (prompt) => `https://copilot.microsoft.com/?q=${encodeURIComponent(prompt)}`,
    fallbackUrl: () => 'https://copilot.microsoft.com/',
    transform: (prompt) => prompt,
    tips: 'Pre-filled in Microsoft Copilot and copied to your clipboard.',
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    brand: 'Image AI',
    prefix: 'Visual Prompt Formula',
    supportsUrlParam: false,
    getUrl: () => 'https://www.midjourney.com/imagine',
    fallbackUrl: () => 'https://discord.com/channels/@me',
    transform: (prompt) => {
      const cleanPrompt = (prompt || '')
        .replace(/act as.*?\./gi, '')
        .replace(/please generate.*?\./gi, '')
        .trim();
      return `/imagine prompt: ${cleanPrompt} --ar 16:9 --style raw --v 6.1`;
    },
    tips: 'Copied in Midjourney /imagine syntax. Ready to paste directly into Midjourney web or Discord.',
  },
  {
    id: 'sora',
    name: 'Sora / Video',
    brand: 'Video AI',
    prefix: 'Cinematographic Framing',
    supportsUrlParam: false,
    getUrl: () => 'https://sora.com/',
    fallbackUrl: () => 'https://runwayml.com/',
    transform: (prompt) => {
      return `Cinematic 4K hyper-detailed footage. ${prompt}. Smooth camera movement, natural depth of field, photorealistic rendering, 60fps pacing, cinematic lighting.`;
    },
    tips: 'Formatted with cinematic camera directives, copied to clipboard for Sora / Runway.',
  },
];

/**
 * Copies text to clipboard safely across modern APIs and fallback iframe execCommand
 */
export async function copyToClipboard(text) {
  if (!text) return false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('Navigator clipboard write failed, using fallback:', err);
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (fallbackErr) {
    console.error('Fallback execCommand copy failed:', fallbackErr);
    return false;
  }
}

/**
 * Opens a URL in a new window/tab safely even when running inside sandboxed environments
 */
export function openExternalUrl(url) {
  if (!url) return false;
  try {
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (win) return true;
  } catch (_e) {
    // If window.open is blocked, trigger simulated anchor click
  }

  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    return true;
  } catch (anchorErr) {
    console.error('Anchor navigation failed:', anchorErr);
    return false;
  }
}

/**
 * Main action: Copies the transformed prompt to clipboard and immediately redirects to the target website
 */
export async function copyAndRedirectToPlatform(platformId, rawPrompt) {
  const platform = PLATFORMS.find((p) => p.id === platformId) || PLATFORMS[0];
  const transformedPrompt = platform.transform(rawPrompt || '');

  // 1. Copy transformed prompt to system clipboard
  const copied = await copyToClipboard(transformedPrompt);

  // 2. Compute target URL with pre-filled query param when supported
  const targetUrl = platform.getUrl(transformedPrompt);

  // 3. Open website in new tab
  openExternalUrl(targetUrl);

  return {
    platform,
    transformedPrompt,
    targetUrl,
    copied,
    supportsUrlParam: platform.supportsUrlParam,
  };
}
