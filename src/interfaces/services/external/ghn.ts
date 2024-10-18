export interface IGHNReqBody {
    from_district_id: number;
    from_ward_code: string;
    to_district_id: number;
    to_ward_code: string;
    service_id: number;
    weight: number;
}

export interface IGHNResponse<T> {
    code: number;
    message: string;
    data: T;
}

export interface CalculateFeeData {
    total: number;
    service_fee: number;
    insurance_fee: number;
    pick_station_fee: number;
    coupon_value: number;
    r2s_fee: number;
    return_again: number;
    document_return: number;
    double_check: number;
    cod_fee: number;
    pick_remote_areas_fee: number;
    deliver_remote_areas_fee: number;
    cod_failed_fee: number;
}

export interface ProvinceData {
    ProvinceID: number;
    ProvinceName: string;
}

export interface DistrictData {
    DistrictID: number;
    ProvinceID: number;
    DistrictName: string;
    Code: string;
    Type: number;
    SupportType: number;
}

export interface WardData {
    WardCode: string;
    DistrictID: number;
    WardName: string;
}
