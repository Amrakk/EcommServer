import fs from "fs";
import path from "path";
import GHNService from "../services/external/ghn.js";
import { isValidJsonFile } from "../utils/isValidJsonFile.js";

import type { IResServices } from "../interfaces/api/response.js";

const wardsFetchLimit = 20;
const wardsFetchTimeout = 5000;

process.on("uncaughtException", (err) => {
    const error = { ...err, message: err.message, name: err.name, stack: err.stack };
    process.send!({ error });
    process.exit(1);
});

const stat: IResServices.Stat = {
    provinces: { length: 0, size: "0 KB" },
    districts: { length: 0, size: "0 KB" },
    wards: { length: 0, size: "0 KB" },
};

const wardsAbsolutePath = path.join(process.cwd(), "public", "address", "wards.json");
const districtsAbsolutePath = path.join(process.cwd(), "public", "address", "districts.json");
const provincesAbsolutePath = path.join(process.cwd(), "public", "address", "provinces.json");

const wardsTempAbsolutePath = path.join(process.cwd(), "public", "address", "temp", `wards.temp.json`);
const districtsTempAbsolutePath = path.join(process.cwd(), "public", "address", "temp", `districts.temp.json`);
const provincesTempAbsolutePath = path.join(process.cwd(), "public", "address", "temp", `provinces.temp.json`);

const isTempFolderCreated = await fs.promises
    .access(path.dirname(provincesTempAbsolutePath))
    .then((_) => true)
    .catch((_) => false);

if (isTempFolderCreated) {
    await Promise.all([
        isValidJsonFile(wardsTempAbsolutePath),
        isValidJsonFile(districtsTempAbsolutePath),
        isValidJsonFile(provincesTempAbsolutePath),
    ])
        .then(() => {
            copyTempToCore();
        })
        .catch((_) => {
            fs.promises.rm(path.dirname(provincesTempAbsolutePath), { recursive: true, force: true });
        });
}

await fs.promises.mkdir(path.dirname(provincesTempAbsolutePath), { recursive: true });

const [provinces, districts] = await Promise.all([GHNService.getProvinces(), GHNService.getDistricts()]);

await Promise.all([
    fs.promises.writeFile(provincesTempAbsolutePath, JSON.stringify(provinces)),
    fs.promises.writeFile(districtsTempAbsolutePath, JSON.stringify(districts)),
]);
const [provincesStat, districtsStat] = await Promise.all([
    fs.promises.stat(provincesTempAbsolutePath),
    fs.promises.stat(districtsTempAbsolutePath),
]);

stat.provinces.length = provinces.length;
stat.districts.length = districts.length;
stat.provinces.size = `${provincesStat.size / 1024} KB`;
stat.districts.size = `${districtsStat.size / 1024} KB`;

const wards: IResServices.Ward[] = [];

for (let i = 0; i < districts.length; i += wardsFetchLimit) {
    const batch = districts.slice(i, i + wardsFetchLimit);

    const wardsBatch = await Promise.all(batch.map((district) => GHNService.getWards(district.district_id)));
    wardsBatch.forEach((districtWards) => {
        if (districtWards) wards.push(...districtWards);
    });

    stat.wards.length = wards.length;
    process.send!({ stat });

    console.log(`Fetched ${i + wardsFetchLimit}/${districts.length} districts`);

    await new Promise((resolve) => setTimeout(resolve, wardsFetchTimeout));
}

await fs.promises.writeFile(wardsTempAbsolutePath, JSON.stringify(wards));
const wardsStat = await fs.promises.stat(wardsTempAbsolutePath);
stat.wards.size = `${wardsStat.size / 1024} KB`;

process.send!({ stat });

/////////// HANDLE CORE FILES ////////////

async function copyTempToCore() {
    await Promise.all([
        fs.promises.copyFile(wardsTempAbsolutePath, wardsAbsolutePath),
        fs.promises.copyFile(districtsTempAbsolutePath, districtsAbsolutePath),
        fs.promises.copyFile(provincesTempAbsolutePath, provincesAbsolutePath),
    ]).catch(async (err) => {
        await Promise.allSettled([
            fs.promises.rm(wardsAbsolutePath, { force: true }),
            fs.promises.rm(districtsAbsolutePath, { force: true }),
            fs.promises.rm(provincesAbsolutePath, { force: true }),
        ]);

        throw err;
    });

    await fs.promises.rm(path.dirname(provincesTempAbsolutePath), { recursive: true, force: true });
    process.send!({ stat });
    process.exit(0);
}

await copyTempToCore();
