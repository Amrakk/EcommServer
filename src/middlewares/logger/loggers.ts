import fs from "fs";
import path from "path";
import { colors, decorators } from "./settings.js";
import { ERROR_LOG_FILE, LOG_FOLDER, REQUEST_LOG_FILE } from "../../constants.js";

import type { Request, Response, NextFunction } from "express";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
    res.on("finish", async () => {
        const ip = req.headers["cf-connecting-ip"] ?? req.headers["x-forwarded-for"] ?? req.ip;
        const method = req.method.toUpperCase();
        const uri = req.url;
        const statusCode = res.statusCode;
        const timestamp = new Date();
        const timeZoneOffset = 7;

        const localTimestamp = new Date(timestamp.getTime() + timeZoneOffset * 60 * 60 * 1000).toLocaleString("en-US", {
            timeZone: "UTC",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        });

        let log =
            `${colors.magenta}[${ip}] ` +
            `${colors.cyan}[${localTimestamp}] ` +
            `${colors.green}${method} ` +
            `${colors.reset}- ` +
            `${colors.yellow}"${uri}" `;

        if (statusCode >= 400) log += `${colors.red}`;
        else if (statusCode >= 300) log += `${colors.yellow}`;
        else if (statusCode >= 200) log += `${colors.green}`;
        else log += `${colors.reset}`;

        log += `${statusCode}${colors.reset} -`;

        console.log(log);

        const absolutePath = path.resolve(process.cwd(), LOG_FOLDER, REQUEST_LOG_FILE);
        const fileLog = `[${ip}] [${localTimestamp}] ${method} - "${uri}" - ${statusCode}`;
        try {
            await fs.promises.access(absolutePath);
            await fs.promises.appendFile(absolutePath, `${fileLog}\n`);
        } catch (err) {
            await fs.promises.mkdir(path.dirname(absolutePath), { recursive: true });
            await fs.promises.writeFile(absolutePath, `${fileLog}\n`);
        }
    });
    return next();
}

export async function errorLogger(err: Error, req: Request) {
    const ip = req.headers["cf-connecting-ip"] ?? req.headers["x-forwarded-for"] ?? req.ip;
    const method = req.method.toUpperCase();
    const uri = req.url;
    const timestamp = new Date();
    const timeZoneOffset = 7;

    const localTimestamp = new Date(timestamp.getTime() + timeZoneOffset * 60 * 60 * 1000).toLocaleString("en-US", {
        timeZone: "UTC",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });

    let log = `[${ip}] [${localTimestamp}] ${method} - "${uri}" - [${err.name}]: ${err.message}`;

    const keys = Object.keys(err);
    for (const key of keys) {
        if (key === "name" || key === "message" || key === "stack") continue;
        log += `\n\t${decorators.singleLine} [${key.toUpperCase()}]: ${safeStringify((err as any)[key], 4).replace(
            /\n/g,
            "\n\t\t"
        )}`;
    }

    if (err.stack) {
        const lines = err.stack.split("\n");
        log += `\n\t${decorators.singleLine} [STACK]:`;
        for (let i = 1; i < lines.length; i++) {
            if (i === 1) log += `\n\t\t${decorators.startLine} [${i}] ${lines[i]}`;
            else if (i === lines.length - 1) log += `\n\t\t${decorators.endLine} [${i}] ${lines[i]}`;
            else log += `\n\t\t${decorators.line} [${i}] ${lines[i]}`;
        }
    }

    const absolutePath = path.resolve(process.cwd(), LOG_FOLDER, ERROR_LOG_FILE);
    try {
        await fs.promises.access(absolutePath);
        await fs.promises.appendFile(absolutePath, `${log}\n`);
    } catch (err) {
        await fs.promises.mkdir(path.dirname(absolutePath), { recursive: true });
        await fs.promises.writeFile(absolutePath, `${log}\n`);
    }
}

function safeStringify(obj: any, space = 4) {
    const seen = new Map<any, string>();

    return JSON.stringify(
        obj,
        function (key, value) {
            if (typeof value === "object" && value !== null) {
                if (seen.has(value)) {
                    return `[Circular -> *${seen.get(value)}]`;
                }
                seen.set(value, this ? key : "root");
            }
            return value;
        },
        space
    );
}
