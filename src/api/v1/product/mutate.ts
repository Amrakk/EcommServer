import ApiController from "../../apiController.js";
import ProductService from "../../../services/product.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";

import type { IProduct } from "../../../interfaces/database/product.js";
import type { IReqInsertProduct } from "../../../interfaces/api/request.js";

export const insert = ApiController.callbackFactory<{}, IReqInsertProduct | IReqInsertProduct[], IProduct[]>(
    async (req, res, next) => {
        try {
            const { body } = req;
            let data = [];

            if (Array.isArray(body)) data = body;
            else data = [body];

            const products = await ProductService.insert(data);
            return res
                .status(200)
                .json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: products });
        } catch (err) {
            next(err);
        }
    }
);

// export async function updateImage(req: Request, res: Response, next: NextFunction) {
//     try {
//         const { id } = req.params;
//         const { image } = req.body;

//         const product = await ProductService.updateImage(id, image);

//         return res.status(200).json(product);
//     } catch (err) {
//         next(err);
//     }
// }
