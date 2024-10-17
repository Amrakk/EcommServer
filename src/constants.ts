/******************/
/******************/
/**  ENVIRONMENT **/
/******************/
/******************/

// CORE
export const ENV = process.env.ENV!;
export const PORT = parseInt(process.env.PORT!);
export const BASE_PATH = process.env.BASE_PATH!;
export const CLIENT_URL = process.env.CLIENT_URL!;
export const SESSION_SECRET = process.env.SESSION_SECRET!;

// GEMAIL
export const EMAIL = process.env.EMAIL!;
export const EMAIL_PASS = process.env.EMAIL_PASS!;

// DEFAULT
export const DEFAULT_AVATAR_URL = process.env.DEFAULT_AVATAR_URL!;
export const DEFAULT_PRODUCT_IMAGE_URL = process.env.DEFAULT_PRODUCT_IMAGE_URL!;

// AUTH
export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;

// DATABASE
export const MONGO_URI = process.env.MONGO_URI!;

export const REDIS_URI = process.env.REDIS_URI!;

// LOG
export const LOG_FOLDER = process.env.LOG_FOLDER ?? "logs";
export const ERROR_LOG_FILE = process.env.ERROR_LOG_FILE ?? "error.log";
export const REQUEST_LOG_FILE = process.env.REQUEST_LOG_FILE ?? "request.log";

// IMGBB
export const IMGBB_API_KEY = process.env.IMGBB_API_KEY!;
export const IMGBB_API_URL = process.env.IMGBB_API_URL!;

// GOOGLE AUTH
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
export const GOOGLE_REDIRECT_PATH = process.env.GOOGLE_REDIRECT_PATH!;
export const GOOGLE_FAILURE_REDIRECT_PATH = process.env.GOOGLE_FAILURE_REDIRECT_PATH!;

// GIAO HANG NHANH
export const GHN_SHOP_ID = process.env.GHN_SHOP_ID!;
export const GHN_API_TOKEN = process.env.GHN_API_TOKEN!;
export const GHN_API_URL = process.env.GHN_API_URL!;

export const GHN_DEFAULT_SERVICE_ID = process.env.GHN_DEFAULT_SERVICE_ID!;
export const GHN_DEFAULT_WEIGHT = parseInt(process.env.GHN_DEFAULT_WEIGHT!);
export const GHN_DEFAULT_WARD_CODE = process.env.GHN_DEFAULT_WARD_CODE!;
export const GHN_DEFAULT_DISTRICT_ID = parseInt(process.env.GHN_DEFAULT_DISTRICT_ID!);

export const GHN_DEFAULT = Object.freeze({
    service_type_id: GHN_DEFAULT_SERVICE_ID,
    weight: GHN_DEFAULT_WEIGHT,
    to_ward_code: GHN_DEFAULT_WARD_CODE,
    to_district_id: GHN_DEFAULT_DISTRICT_ID,
});

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
    FORBIDDEN = 3,
    NOT_FOUND = 4,
    BAD_REQUEST = 5,
    VALIDATION_ERROR = 8,

    INTERNAL_SERVER_ERROR = 100,
}

export enum RESPONSE_MESSAGE {
    SUCCESS = "Operation completed successfully",
    UNAUTHORIZED = "Access denied! Please provide valid authentication",
    FORBIDDEN = "You don't have permission to access this resource",
    NOT_FOUND = "Resource not found! Please check your data",
    BAD_REQUEST = "The request could not be understood or was missing required parameters",
    VALIDATION_ERROR = "Input validation failed! Please check your data",

    INTERNAL_SERVER_ERROR = "An unexpected error occurred! Please try again later.",
}

// USER
export enum USER_ROLE {
    CUSTOMER = "customer",
    ADMIN = "admin",
}

export enum USER_STATUS {
    NORMAL = "normal",
    BLOCKED = "blocked",
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
