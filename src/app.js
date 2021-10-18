import pg from 'pg';
import express from 'express';
import cors from 'cors';
import { schemaGames, schemaCustomers } from './schema.js';

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
            console.log(existAlready.rows.length)
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
        console.log("entrei")
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
console.log(cpf)
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
        console.log(error)
        console.log("entrei")
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
        console.log(result.rows)
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
    console.log(id, name, phone, cpf, birthday)
    try{
        const result = await connection.query('SELECT * FROM customers WHERE id = $1;', [id]);
        if(result.rows.length === 0 ){
            res.sendStatus(404);
            return
        }
        if(result.rows[0].cpf !== cpf){
            console.log("entrei")
            const result = await connection.query('SELECT * FROM customers WHERE cpf = $1;',[cpf]);
            if(result.rows.length !== 0){
                console.log("deu bom")
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

app.get("/rentals",(req, res)=>{
        res.send("hey");
});



app.listen(4000);