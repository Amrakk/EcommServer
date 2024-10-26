import type { ObjectId } from "mongooat";
import type { PRODUCT_CATEGORY } from "../../constants.js";

export interface IProduct {
    _id: ObjectId;
    name: string;
    images: string[];
    description: string;
    category: PRODUCT_CATEGORY;
    variants: IProductVariant[];
    brand: string;
    relevantProducts?: ObjectId[];
    details: { [key: string]: string };
    ratings: number;
    tags: string[];
}

export interface IProductVariant {
    id: string;
    quantity: number;
    importPrice: number;
    retailPrice: number;
    details: { [key: string]: string };
}

export interface IProductRating {
    _id: ObjectId;
    userId: ObjectId;
    productId: ObjectId;
    rating: number;
    review: string;
    createdAt: Date;
    updatedAt: Date;
}
