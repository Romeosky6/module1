import express from 'express';
import "dotenv/config";
import {fileURLToPath} from "url";
import path from "path";

// DB import
import POOL from "./database/db.js";
import {PORT} from './lib/index.js';

const app = express();

app.set("views", "./views");
app.set("view engine", "ejs");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname + "/public")));

// ROUTES

app.get("/", async function(req, res, next) {
    const [result] = await POOL.execute(`SELECT orderNumber, shippedDate, orderDate, status, orders.customerNumber
                                   FROM orders
                                   JOIN customers ON customers.customerNumber = orders.customerNumber`);
    res.render("layout", {template: "home", datas: result});
});

app.get("/detail/:orderId/:customerId", async function(req,res,next){
    console.log('orderId --> ', req.params.orderId);
    console.log('customerId ---> ', req.params.customerId);
    const [purchaseOrder] = await POOL.execute(`SELECT orders.orderNumber, productName, quantityOrdered, priceEach, ROUND((quantityOrdered * priceEach),2) AS totalPrice
                                                FROM orderdetails 
                                                INNER JOIN orders ON orderdetails.orderNumber = orders.orderNumber 
                                                INNER JOIN products ON orderdetails.productCode = products.productCode
                                                WHERE ?
                                                ORDER BY productName;` [req.params.orderId]);

    const [priceDetails] = await POOL.execute(`SELECT ROUND((quantityOrdered * priceEach),2) AS ht, 
                                               ROUND((quantityOrdered * priceEach) * 20 / 100, 2) AS tva, 
                                               ROUND((quantityOrdered * priceEach) + ((quantityOrdered * priceEach) * 20 / 100), 2) AS ttc 
                                               FROM orderdetails
                                               WHERE ?;` [req.params.orderId]);

    const [customersInfo] = await POOL.execute(`SELECT customerName, contactLastName, contactFirstName, addressLine1, addressLine2, city, orderNumber 
                                                FROM customers
                                                JOIN orders ON customers.customerNumber = orders.customerNumber
                                                WHERE ?;` [req.params.orderId]);


    
    // res.end à remplacer par la méthode de rendu
    res.render("layout", {template: "details", purchaseOrder: purchaseOrder[0], priceDetails: priceDetails[0], customersInfo: customersInfo[0]});
});


app.listen(9000, ()=> {
    console.log(`Listening at http://localhost:${PORT}`);
}); 