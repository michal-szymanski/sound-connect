type Emoji = {
    emoji: string;
    name: string;
    keywords: string[];
    category: string;
};

const RECENT_EMOJIS_KEY = 'emoji-picker-recent';
const MAX_RECENT = 24;

export function searchEmojis(query: string, emojis: Emoji[]): Emoji[] {
    if (!query) return emojis;

    const lowerQuery = query.toLowerCase();
    return emojis.filter((emoji) => emoji.name.toLowerCase().includes(lowerQuery) || emoji.keywords.some((k) => k.toLowerCase().includes(lowerQuery)));
}

export function getRecentEmojis(): string[] {
    try {
        const stored = localStorage.getItem(RECENT_EMOJIS_KEY);
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function addRecentEmoji(emoji: string): void {
    try {
        const recent = getRecentEmojis();
        const filtered = recent.filter((e) => e !== emoji);
        const updated = [emoji, ...filtered].slice(0, MAX_RECENT);
        localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(updated));
    } catch {
        return;
    }
}

export function insertAtCursor(element: HTMLTextAreaElement | HTMLInputElement, text: string): void {
    const start = element.selectionStart ?? element.value.length;
    const end = element.selectionEnd ?? element.value.length;
    const before = element.value.substring(0, start);
    const after = element.value.substring(end);

    element.value = before + text + after;

    const newPosition = start + text.length;
    element.setSelectionRange(newPosition, newPosition);
    element.focus();
}
