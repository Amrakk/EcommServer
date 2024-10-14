export interface IResImgbbImage {
    status: number;
    success: boolean;
    data: {
        id: string;
        title: string;
        url_viewer: string;
        url: string;
        display_url: string;
        size: number;
        time: string;
        expiration: string;
        image: {
            filename: string;
            name: string;
            mime: string;
            extension: string;
            url: string;
        };
        thumb: {
            filename: string;
            name: string;
            mime: string;
            extension: string;
            url: string;
        };
        medium?: {
            filename: string;
            name: string;
            mime: string;
            extension: string;
            url: string;
        };
        delete_url: string;
    };
}

export interface IImage {
    url: string;
    deleteUrl: string;
}
