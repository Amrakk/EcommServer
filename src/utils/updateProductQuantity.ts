import ProductService from "../services/internal/product.js";

import type { ObjectId } from "mongooat";
import type { IProduct } from "../interfaces/database/product.js";
import type { IOrderItem } from "../interfaces/database/order.js";

export async function updateProductQuantity(orderItems: IOrderItem[], products: IProduct[]) {
    const updateMap = new Map<string, { productId: string | ObjectId; variantId: string; quantityOffset: number }>();

    orderItems.forEach((item) => {
        const product = products.find((p) => `${p._id}` === `${item.product._id}`);
        const variant = product?.variants.find((v) => v.id === item.variant.id);
        if (!variant) return;

        const quantityOffset = -item.quantity;
        const key = `${product!._id}-${variant!.id}`;

        if (updateMap.has(key)) {
            updateMap.get(key)!.quantityOffset += quantityOffset;
        } else {
            updateMap.set(key, {
                productId: product!._id,
                variantId: variant!.id,
                quantityOffset,
            });
        }
    });

    await Promise.all(
        Array.from(updateMap.values()).map(({ productId, variantId, quantityOffset }) =>
            ProductService.updateVariantQuantity(productId, variantId, quantityOffset)
        )
    );
}
