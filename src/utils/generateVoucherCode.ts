import { randomUUID } from "crypto";

/**
 * Default pattern is /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/
 * else it will be /^[prefix]-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/
 */
export function generateVoucherCode(prefix?: string): string {
    let parts = randomUUID().split("-");
    parts = parts.map((part) => part.slice(0, 4).toUpperCase());
    if (!prefix) return parts.join("-");
    else return `${prefix.toUpperCase()}-${parts.slice(0, 3).join("-")}`;
}
