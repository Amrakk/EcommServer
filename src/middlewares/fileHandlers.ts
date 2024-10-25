import multer from "multer";

import { ValidateError } from "mongooat";

import type { NextFunction, Response, Request } from "express";

export const imageUploader = (req: Request, res: Response, next: NextFunction) =>
    multer({
        limits: {
            fileSize: 1024 * 1024 * 10,
        },
        fileFilter: (req, file, callback) => {
            if (file.mimetype.startsWith("image/")) callback(null, true);
            else
                callback(
                    new ValidateError("Invalid file type", [
                        { code: "custom", message: "Invalid file type", path: ["image"] },
                    ])
                );
        },
    }).single("image")(req, res, (err) => (err ? next(err) : next()));
