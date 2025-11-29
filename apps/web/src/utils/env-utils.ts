export function isServer(): boolean {
    return typeof window === 'undefined';
}

export function isTouchDevice(): boolean {
    if (isServer()) return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}
