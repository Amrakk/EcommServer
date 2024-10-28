export function removeUndefinedKeys<T extends Record<string, any>>(obj: T): T {
    return Object.fromEntries(Object.entries(obj).filter(([_, value]) => value !== undefined)) as T;
}
