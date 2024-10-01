import crypto from "crypto";

export async function hashPassword(password) {
    const salt = crypto.randomBytes(8).toString("hex");
    const hash = await new Promise((res, rej) =>
        crypto.scrypt(password, salt, 32, (err, derivedKey) => {
            if (err) rej(err);
            res(derivedKey.toString("hex"));
        })
    );

    return `${salt}:${hash}`;
}

export async function verifyPassword(password, storedHash) {
    const [salt, originalHash] = storedHash.split(":");

    const derivedHash = await new Promise((res, rej) =>
        crypto.scrypt(password, salt, 32, (err, derivedKey) => {
            if (err) rej(err);
            res(derivedKey.toString("hex"));
        })
    );

    const originalBuffer = Buffer.from(originalHash, "hex");
    const derivedBuffer = Buffer.from(derivedHash, "hex");

    return crypto.timingSafeEqual(originalBuffer, derivedBuffer);
}
