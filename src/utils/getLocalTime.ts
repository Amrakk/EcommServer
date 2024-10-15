import { UTC_OFFSET } from "../constants.js";

export function getLocalTime(date: Date = new Date()): Date {
    return new Date(date.getTime() + UTC_OFFSET * 60 * 60 * 1000);
}
