/******************/
/******************/
/**  ENVIRONMENT **/
/******************/
/******************/

// CORE
export const PORT = parseInt(process.env.PORT!);
export const BASE_PATH = process.env.BASE_PATH!;
export const CLIENT_URL = process.env.CLIENT_URL!;
export const DEFAULT_AVATAR_URL = process.env.DEFAULT_AVATAR_URL!;

// DATABASE
export const MONGO_URI = process.env.MONGO_URI!;

export const REDIS_URI = process.env.REDIS_URI!;

// LOG
export const LOG_FOLDER = process.env.LOG_FOLDER ?? "logs";
export const ERROR_LOG_FILE = process.env.ERROR_LOG_FILE ?? "error.log";
export const REQUEST_LOG_FILE = process.env.REQUEST_LOG_FILE ?? "request.log";

// GOOGLE AUTH
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
export const GOOGLE_REDIRECT_PATH = process.env.GOOGLE_REDIRECT_PATH!;

// GIAO HANG NHANH
export const GHN_SHOP_ID = process.env.GHN_SHOP_ID!;
export const GHN_API_TOKEN = process.env.GHN_API_TOKEN!;

// PAYOS
export const PAYOS_API_KEY = process.env.PAYOS_API_KEY!;
export const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID!;
export const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY!;

/******************/
/******************/
/**     ENUM     **/
/******************/
/******************/
export enum RESPONSE_CODE {
    SUCCESS = 0,
    UNAUTHORIZED = 1,
    VALIDATION_ERROR = 8,

    INTERNAL_SERVER_ERROR = 100,
}

export enum RESPONSE_MESSAGE {
    SUCCESS = "Operation completed successfully",
    UNAUTHORIZED = "Access denied! Please provide valid authentication",
    VALIDATION_ERROR = "Input validation failed! Please check your data",

    INTERNAL_SERVER_ERROR = "An unexpected error occurred! Please try again later.",
}

// USER
export enum USER_ROLE {
    CUSTOMER = "customer",
    ADMIN = "admin",
}

export enum USER_STATUS {
    BLOCKED = "blocked",
    VERIFIED = "verified",
    UNVERIFIED = "unverified",
}

export enum SOCIAL_MEDIA_PROVIDER {
    GOOGLE = "google",
}

// PRODUCT
export enum PRODUCT_CATEGORY {
    ELECTRONICS = "electronics",
    FASHION = "fashion",
    BEAUTY = "beauty",
    HOME = "home",
    BOOKS = "books",
    TOYS = "toys",
    SPORTS = "sports",
    FOOD = "food",
    OTHERS = "others",
}

// ORDER
export enum ORDER_STATUS {
    PENDING = "pending",
    PACKAGING = "packaging",
    SHIPPING = "shipping",
    DELIVERED = "delivered",
    COMPLETED = "completed",
    CANCELED = "canceled",
}

// PAYMENT
export enum PAYMENT_STATUS {
    PENDING = "pending",
    PAID = "paid",
    FAILED = "failed",
    EXPIRED = "expired",
}

export enum PAYMENT_TYPE {
    COD = "cod",
    MOMO = "momo",
    PAYOS = "payos",
}

// PROMOTE
export enum DISCOUNT_TYPE {
    FIXED = "fixed",
    PERCENT = "percent",
}
