import pg from 'pg';
import express from 'express';
import cors from 'cors';
import dayjs from 'dayjs';
import { schemaGames, schemaCustomers, schemaRentals } from './schema.js';

const { Pool } = pg;

const user = 'bootcamp_role';
const password = 'senha_super_hiper_ultra_secreta_do_role_do_bootcamp';
const host = 'localhost';
const port = 5432;
const database = 'boardcamp';

const connection = new Pool({
  user,
  password,
  host,
  port,
  database
});


const app = express();
app.use(cors());
app.use(express.json());

app.get("/categories", async(req, resp)=>{

    try{
        const result =  await connection.query('SELECT * FROM categories;');
        resp.send(result.rows);
        
    }
    catch(erro){
        resp.sendStatus(500)
    }

});

app.post("/categories", async(req, resp)=>{
    const {name} = req.body;
    if( !name || name.length === 0){
        resp.sendStatus(400);
        return
    }
     
    try{
        const existAlready = await connection.query(`SELECT (name) FROM categories WHERE name = $1`,[name]);
        if(existAlready.rows.length !== 0){
      
            resp.sendStatus(409);
            return
        }
        else{
            const result = await connection.query(`INSERT INTO categories (name) VALUES ($1);`, [name]);
            resp.sendStatus(201);
            return
        }
    } catch{
        resp.sendStatus(500);
    }
 
});

app.get("/games",async(req, res)=>{
    const name = req.query.name;

    if(!name){
        try{
            const result = await connection.query('SELECT games.*, categories.name AS "categoryName" FROM games JOIN categories ON games."categoryId" = categories.id;');

            res.send(result.rows);
            return

        }catch{
            resp.sendStatus(500);
            return
        }
    }
    else{
        const result = await connection.query('SELECT games.*, categories.name AS "categoryName" FROM games JOIN categories ON games."categoryId" = categories.id WHERE LOWER(games.name) LIKE LOWER($1);', [name+"%"]);
        res.send(result.rows);
    }
});

app.post("/games", async(req, res)=>{
    const { error } = schemaGames.validate(req.body);

    if(error){
  
        res.sendStatus(400);
        return
    }
    const {
        name, image, stockTotal, categoryId, pricePerDay
    } = req.body;
    
    try{
        const result = await connection.query("SELECT * FROM games WHERE name = $1;", [req.body.name]);
        if(result.rows.length !== 0 ){
            res.sendStatus(409);
            return
        }
    }catch{
        res.sendStatus(500);
        return
    }

    try{
        const result = await connection.query('INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5)', [name, image, stockTotal, categoryId, pricePerDay]);
        res.sendStatus(201);
        return

    }catch{
        res.sendStatus(500);
        return
    }
})

app.get("/customers",async(req,res)=>{
    const cpf =req.query.cpf;

    if(!cpf){
        try { 
        const result = await connection.query('SELECT * FROM customers;');
        res.send(result.rows);
        return

        }catch{
            resp.sendStatus(500);
            return
        }
    }
    else{
        try{
            const result = await connection.query('SELECT * FROM customers WHERE LOWER(cpf) LIKE LOWER($1);',[cpf + '%']);
            res.send(result.rows)
            return

        }catch{
            res.sendStatus(500);
        return
        }
    }
});

app.get("/customers/:id", async(req, res)=>{
    const id = req.params.id;
    
    try{
        const result = await connection.query('SELECT * FROM customers WHERE id = $1;',[id]);
        
        if(result.rows.length === 0){
            res.status(404).send("inexistente");
            return
        }
        res.status(200).send(result.rows);

    }catch{
        res.sendStatus(500);
        return
    }
    

});

app.post("/customers", async(req, res)=>{
    const { error } = schemaCustomers.validate(req.body);

    if(error){
        res.sendStatus(400);
        return
    }

    const {
        name,
        phone,
        cpf,
        birthday
    } = req.body;

    try{
        const result = await connection.query('SELECT * FROM customers WHERE cpf = $1;', [cpf]);
        if(result.rows.length !== 0 ){
            res.sendStatus(409);
            return
        }
  
    }
    catch{
        res.sendStatus(500);
        return
    }

    try{
        const result = await connection.query(`INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4);`, [name, phone, cpf, birthday]);
        res.send(201);
        return

    }catch{
        res.sendStatus(500);
        return
    }

});

app.put("/customers/:id", async(req, res)=>{
    const { error } = schemaCustomers.validate(req.body)
    if(error){
        console.log(error)
        res.sendStatus(400);
        return
    }
    const id = req.params.id;
    const {
        name,
        phone,
        cpf,
        birthday
    } = req.body;
   
    try{
        const result = await connection.query('SELECT * FROM customers WHERE id = $1;', [id]);
        if(result.rows.length === 0 ){
            res.sendStatus(404);
            return
        }
        if(result.rows[0].cpf !== cpf){
          
            const result = await connection.query('SELECT * FROM customers WHERE cpf = $1;',[cpf]);
            if(result.rows.length !== 0){
               
                res.sendStatus(409)
                return
            }
        }
         await connection.query('UPDATE customers SET name = $2, phone = $3, cpf = $4, birthday = $5 WHERE id = $1;', [id, name, phone, cpf,birthday])
        res.sendStatus(200);
    }
    catch(err){
        console.log(err)
        res.sendStatus(500);
        return
    }

});

app.get("/rentals", async(req, res)=>{
    const {customerId , gameId} = req.query;

    if(!customerId && !gameId){
        const result = await connection.query(`
        SELECT 
            rentals.*, 
            games.id AS "gameId", 
            games.name AS "gameName", 
            games."categoryId",
            customers.id AS "custumerId", 
            customers.name AS "customersName",
            categories.name AS "categoryName",
            categories.id AS "categoryId"
        FROM 
            rentals 
        JOIN customers 
            ON rentals."customerId" = customers.id 
        JOIN games 
            ON rentals."gameId" = games.id 
        JOIN categories
            ON games."categoryId" = categories.id
        ;`);

        const newArray= []; 
       result.rows.forEach((rent, index) => {
            rent ={
                id: rent.id,
                customerId: rent.customerId,
                gameId: rent.gameId,
                rentDate: rent.rentDate,
                daysRented: rent.daysRented,
                returnDate: rent.returnDate,
                originalPrice: rent.originalPrice,
                delayFee: rent.delayFee,
                customer:{
                    id: rent.customerId,
                    name: rent.customersName
                },
                game:{
                    id: rent.gameId,
                    name: rent.gameName,
                    categoryId: rent.categoryId,
                    categoryName: rent.categoryName
                }

            }
            newArray.push(rent);
        });

        res.send(newArray)
    }
    if(customerId){
        const result = await connection.query(`
        SELECT 
            rentals.*, 
            games.id AS "gameId", 
            games.name AS "gameName", 
            games."categoryId",
            customers.id AS "custumerId", 
            customers.name AS "customersName",
            categories.name AS "categoryName",
            categories.id AS "categoryId"
        FROM 
            rentals 
        JOIN customers 
            ON rentals."customerId" = customers.id 
        JOIN games 
            ON rentals."gameId" = games.id 
        JOIN categories
            ON games."categoryId" = categories.id
        WHERE customers.id = $1
        ;`, [customerId]);

        const newArray= []; 
        result.rows.forEach((rent, index) => {
            rent ={
                id: rent.id,
                customerId: rent.customerId,
                gameId: rent.gameId,
                rentDate: rent.rentDate,
                daysRented: rent.daysRented,
                returnDate: rent.returnDate,
                originalPrice: rent.originalPrice,
                delayFee: rent.delayFee,
                customer:{
                    id: rent.customerId,
                    name: rent.customersName
                },
                game:{
                    id: rent.gameId,
                    name: rent.gameName,
                    categoryId: rent.categoryId,
                    categoryName: rent.categoryName
                }

            }
            newArray.push(rent);
        });


        res.send(newArray);
    }
    if(gameId){
        const result = await connection.query(`
        SELECT 
            rentals.*, 
            games.id AS "gameId", 
            games.name AS "gameName", 
            games."categoryId",
            customers.id AS "custumerId", 
            customers.name AS "customersName",
            categories.name AS "categoryName",
            categories.id AS "categoryId"
        FROM 
            rentals 
        JOIN customers 
            ON rentals."customerId" = customers.id 
        JOIN games 
            ON rentals."gameId" = games.id 
        JOIN categories
            ON games."categoryId" = categories.id
        WHERE games.id = $1
        ;`, [gameId]);

        const newArray= []; 
        result.rows.forEach((rent, index) => {
            rent ={
                id: rent.id,
                customerId: rent.customerId,
                gameId: rent.gameId,
                rentDate: rent.rentDate,
                daysRented: rent.daysRented,
                returnDate: rent.returnDate,
                originalPrice: rent.originalPrice,
                delayFee: rent.delayFee,
                customer:{
                    id: rent.customerId,
                    name: rent.customersName
                },
                game:{
                    id: rent.gameId,
                    name: rent.gameName,
                    categoryId: rent.categoryId,
                    categoryName: rent.categoryName
                }

            }
            newArray.push(rent);
        });


        res.send(newArray);
    }

});

app.post("/rentals", async(req, res)=>{
    const { error } = schemaRentals.validate(req.body);

    if(error){
        res.sendStatus(400);
        return
    }

    const {
        customerId,
        gameId,
        daysRented,
    } = req.body;

    try{
        const resultCustomer = await connection.query('SELECT * FROM customers WHERE id = $1;', [customerId]);
        const resultGame = await connection.query('SELECT * FROM games WHERE id = $1;', [gameId]);

        if(resultCustomer.rows.length === 0 || resultGame.rows.length === 0){
            res.sendStatus(400);
            return
        }
        const resultGameStockTotal = await connection.query('SELECT * FROM games WHERE id = $1;',[gameId]);
    
        const gamesAvailable = resultGameStockTotal.rows[0].stockTotal;
        const pricePerDay = resultGameStockTotal.rows[0].pricePerDay;

        const resultTotalRents = await connection.query('SELECT * FROM rentals WHERE "gameId" = $1;',[gameId]);
        const rentsMade = resultTotalRents.rows.length;

        if(gamesAvailable <= rentsMade){
            res.sendStatus(400);
            return
        }
        const rentDate = dayjs().format('YYYY-MM-DD');
        const originalPrice = (daysRented*pricePerDay);
      
        const resultInsert = await connection.query('INSERT INTO rentals ("customerId", "gameId", "rentDate", "daysRented", "returnDate", "originalPrice", "delayFee") VALUES ($1, $2, $3, $4, $5, $6, $7);',[customerId, gameId, rentDate, daysRented, null, originalPrice, null]);

        res.sendStatus(201)

    }catch(err){
        console.log(err)
        res.sendStatus(500);
        return
    }

});

app.post("/rentals/:id/return", async(req,res)=>{
    const id = req.params.id;
    let isLate = false;
    let daysLate = 0;

    try{
        const resultID = await connection.query('SELECT * FROM rentals WHERE id = $1;', [id]);
        if(resultID.rows.length === 0 || !resultID.rows.returnDate){
            console.log("entrei")
            res.sendStatus(400);
            return
        }

        const result = await connection.query('SELECT * FROM rentals WHERE id = $1;', [id]);
        const rentDate = result.rows[0].rentDate;
        const daysRented = result.rows[0].daysRented
        const pricePerDay = (result.rows[0].originalPrice/daysRented);

        const dayRent = new Date(rentDate).getDate()
        const monthRent = (new Date(rentDate).getMonth())+1;
        const todayMonth = new Date().getMonth() +1;
        const todayDay = new Date().getDate();
            
            
        if(todayMonth === monthRent){
            
            if(daysRented+dayRent >= todayDay){
                isLate = false;
                console.log("entrei")
            }
            else{
                isLate= true;
                daysLate = todayDay - dayRent;
       
            }
        }
        else{
            let test =  parseInt((new Date() - new Date(rentDate))/(1000 * 3600 * 24));
            isLate = true;
            daysLate = test
        }
        if(isLate){
            const delayFee =(daysLate -daysRented) * pricePerDay;
            await connection.query('UPDATE rentals SET "delayFee"= $2 WHERE id=$1', [id, delayFee])
        }
        await connection.query('UPDATE rentals SET "returnDate"= $2 WHERE id=$1', [id, new Date()]);

        
        res.sendStatus(200)

    }catch(err){
        console.log(err)
        res.sendStatus(500);
        return
    }


});



app.listen(4000);

