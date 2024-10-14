db = db.getSiblingDB("EComm");

db.products.insertMany([
    { name: "Smartphone X", price: 999.99 },
    { name: "Laptop Pro", price: 1499.99 },
    { name: "Wireless Earbuds", price: 129.99 },
]);
