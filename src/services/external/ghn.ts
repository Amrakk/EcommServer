import NotFoundError from "../../errors/NotFoundError.js";
import { IResServices } from "../../interfaces/api/response.js";
import { GHN_API_TOKEN, GHN_API_HOST, GHN_DEFAULT, GHN_SHOP_ID } from "../../constants.js";

import type {
    IGHNReqBody,
    IGHNResponse,
    CalculateFeeData,
    ProvinceData,
    DistrictData,
    WardData,
} from "../../interfaces/services/external/ghn.js";

export default class GHNService {
    public static async getShippingFee(districtId: number, wardCode: string): Promise<number> {
        const body: IGHNReqBody = {
            ...GHN_DEFAULT,
            to_district_id: districtId,
            to_ward_code: wardCode,
        };

        return fetch(`${GHN_API_HOST}/v2/shipping-order/fee`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Token: GHN_API_TOKEN,
                ShopId: GHN_SHOP_ID,
            },
            body: JSON.stringify(body),
        })
            .then((res) => res.json())
            .then((data: IGHNResponse<CalculateFeeData>) => {
                if (data.code !== 200) throw new NotFoundError();

                return data.data.total;
            });
    }

    public static async getProvinces(): Promise<IResServices.Province[]> {
        return await fetch(`${GHN_API_HOST}/master-data/province`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Token: GHN_API_TOKEN,
            },
        })
            .then((res) => res.json())
            .then((data: IGHNResponse<ProvinceData[]>) => {
                if (data.code !== 200) throw new NotFoundError();

                return data.data.map((province) => ({
                    province_name: province.ProvinceName,
                    province_id: province.ProvinceID,
                }));
            });
    }

    public static async getDistricts(provinceId: number = -1): Promise<IResServices.District[]> {
        return await fetch(`${GHN_API_HOST}/master-data/district`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Token: GHN_API_TOKEN,
            },
            body: JSON.stringify({ province_id: provinceId }),
        })
            .then((res) => res.json())
            .then((data: IGHNResponse<DistrictData[]>) => {
                if (data.code !== 200) throw new NotFoundError();

                return data.data.map((district) => ({
                    district_id: district.DistrictID,
                    district_name: district.DistrictName,
                    province_id: district.ProvinceID,
                }));
            });
    }

    public static async getWards(districtId: number): Promise<IResServices.Ward[] | null> {
        return await fetch(`${GHN_API_HOST}/master-data/ward?district_id`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Token: GHN_API_TOKEN,
            },
            body: JSON.stringify({ district_id: districtId }),
        })
            .then((res) => res.json())
            .then((data: IGHNResponse<WardData[]>) => {
                if (data.code !== 200) throw new NotFoundError();

                if (!data.data) return null;

                return data.data.map((ward) => ({
                    ward_code: ward.WardCode,
                    ward_name: ward.WardName,
                    district_id: ward.DistrictID,
                }));
            });
    }
}
