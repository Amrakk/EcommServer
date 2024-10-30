import fs from "fs";
import path from "path";
import { PCY_API_URL } from "../../constants.js";
import { exportOrderItemsToCSV } from "../../utils/exportOrderItemsToCSV.js";

import ServiceResponseError from "../../errors/ServiceResponseError.js";

import type { AssociationRule, JobStatus } from "../../interfaces/services/external/pcy.js";

const defaultJobStatus: JobStatus = { status: "idle", start_time: null, elapsed_time: 0, result: "", files: {} };

export default class PCYService {
    public static async analyze(supportThreshold: number = 0.1, confidenceThreshold: number = 0.3) {
        const orderItemCSVPath = path.join(process.cwd(), "public", "temp", "orderItems.csv");
        await fs.promises.mkdir(path.dirname(orderItemCSVPath), { recursive: true });

        let jobStatus = await new Promise<JobStatus>((res, rej) =>
            exportOrderItemsToCSV(orderItemCSVPath, async () => {
                const file = await fs.promises.readFile(orderItemCSVPath);
                const blob = new Blob([file], { type: "text/csv" });

                const formData = new FormData();

                formData.append("file", blob, "orderItems.csv");
                formData.append("support-threshold", supportThreshold.toString());
                formData.append("confidence-threshold", confidenceThreshold.toString());

                const response = await fetch(`${PCY_API_URL}/pcy/`, {
                    method: "POST",
                    body: formData,
                });

                if (response.headers.get("Content-Type") === "application/json") {
                    const jsonResponse = await response.json();
                    console.log(jsonResponse);

                    const start_time = jsonResponse.start_time
                        ? new Date(jsonResponse.start_time * 1000)
                        : jsonResponse.status === "started"
                        ? new Date()
                        : null;

                    res({ ...defaultJobStatus, ...jsonResponse, start_time });
                }

                const details = {
                    url: response.url,
                    status: response.status,
                    headers: response.headers,
                    message: response.statusText,
                    text: response.headers.get("Content-Type") === "text/html" ? await response.text() : "",
                };
                rej(new ServiceResponseError("PCYApi", "analyze", "Unexpected response", details));
            })
        );

        return jobStatus;
    }

    public static async getJobStatus() {
        const jobStatus = await fetch(`${PCY_API_URL}/check-status`).then((res) => res.json());
        jobStatus.start_time = jobStatus.start_time ? new Date(jobStatus.start_time * 1000) : null;
        return jobStatus;
    }

    public static async getAssociationRules(): Promise<AssociationRule[]> {
        const response = await fetch(`${PCY_API_URL}/association-rules/`);
        if (response.headers.get("Content-Type") === "application/json") {
            const associationRules = await response.json();
            if ("error" in associationRules)
                throw new ServiceResponseError("PCY", "getAssociationRules", "Error in response", associationRules);

            return (associationRules as AssociationRule[])
                .map((rule) => ({ ...rule, confidence: parseFloat(`${rule.confidence}`) }))
                .sort((a, b) => b.confidence - a.confidence);
        }

        const details = {
            url: response.url,
            status: response.status,
            headers: response.headers,
            message: response.statusText,
            text: response.headers.get("Content-Type") === "text/html" ? await response.text() : "",
        };
        throw new ServiceResponseError("PCY", "getAssociationRules", "Unexpected response", details);
    }
}
