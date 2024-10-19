export function formatDuration(duration: number): string;
export function formatDuration(start: Date, end: Date): string;
export function formatDuration(startOrDuration: Date | number, end?: Date): string {
    let ms: number;
    if (end === undefined) ms = startOrDuration as number;
    else ms = end.getTime() - (startOrDuration as Date).getTime();

    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    const milliseconds = ms % 1000;

    let result = "";

    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m `;
    if (seconds > 0) result += `${seconds}s `;

    result += `${milliseconds}ms`;

    return result.trim();
}
