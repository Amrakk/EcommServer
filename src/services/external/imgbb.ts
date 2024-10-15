import axios from "axios";
import { IMGBB_API_KEY, IMGBB_API_URL } from "../../constants.js";

import type { IImage, IResImgbbImage } from "../../interfaces/services/external/imgbb.js";

export default class ImgbbService {
    public static async uploadImage(image: string | Buffer): Promise<IImage> {
        const data = new FormData();

        if (image instanceof Buffer) {
            const base64 = image.toString("base64");
            data.append("image", base64);
        } else if (typeof image === "string") {
            data.append("image", image);
        }
        console.log(123);
        return fetch(`${IMGBB_API_URL}?key=${IMGBB_API_KEY}`, {
            method: "POST",
            body: data,
        })
            .then((res) => res.json())
            .then((res: IResImgbbImage) => {
                return { url: res.data.url, deleteUrl: res.data.delete_url };
            });
    }
}
