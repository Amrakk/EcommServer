import fs from "fs";
import { Transform } from "stream";
import { OrderModel } from "../database/models/order.js";
import { errorLogger } from "../middlewares/logger/loggers.js";

export function exportOrderItemsToCSV(filePath: string, callback: () => Promise<void>) {
    const fileStream = fs.createWriteStream(filePath);
    const csvHeaders = "index,order_id,product_id,product_name\n";
    fileStream.write(csvHeaders);

    const pipeline = [
        { $unwind: "$items" },
        {
            $setWindowFields: {
                sortBy: { createdAt: -1 },
                output: {
                    index: { $documentNumber: {} },
                },
            },
        },
        {
            $project: {
                index: 1,
                order_id: "$_id",
                product_id: "$items.product._id",
                product_name: "$items.product.name",
            },
        },
        { $sort: { index: 1 } },
    ];

    const cursor = OrderModel.collection.aggregate(pipeline).stream();

    const transformStream = new Transform({
        objectMode: true,
        transform(doc, encoding, callback) {
            const csvRow = `${doc.index},${doc.order_id},${doc.product_id},${doc.product_name}\n`;
            callback(null, csvRow);
        },
    });

    cursor.pipe(transformStream).pipe(fileStream);

    fileStream.on("error", async (err) => {
        await errorLogger(err);
    });

    cursor.on("error", async (err) => {
        await errorLogger(err);
    });

    fileStream.on("finish", async () => {
        await callback();
    });
}
