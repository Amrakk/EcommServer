import fs from "fs";

export async function isValidJsonFile(filePath: string): Promise<void> {
    JSON.parse(await fs.promises.readFile(filePath, "utf-8"));
}
