import ApiController from "../../apiController.js";
import CartService from "../../../services/internal/cart.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";

import type { ICart } from "../../../interfaces/database/cart.js";
import type { IReqInsertCart } from "../../../interfaces/api/request.js";

export const insert = ApiController.callbackFactory<{}, IReqInsertCart | IReqInsertCart[], ICart[]>(
    async (req, res, next) => {
        try {
            const { body } = req;
            let data = [];

            if (Array.isArray(body)) data = body;
            else data = [body];

            const carts = await CartService.insert(data);
            return res
                .status(200)
                .json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: carts });
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
