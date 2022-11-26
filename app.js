const express = require('express')
const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;
const crypto = require('crypto')
const algorithm = 'aes-256-cbc' //// set encryption algorithm. secret secretKey is used for both encryption and decryption
const secretKey = "asfsafdsdsfdsafdsadsfdsfsdfsdsff" // // private secretKey, must be of 32 characters
//const iv = crypto.randomBytes(16) // random 16 digit initialization vector

const app = express()
const dbUri = 'mongodb://localhost:27017/'
app.set("view engine", "ejs");

// connect with mongo DB server
MongoClient.connect(dbUri, function (error, client) {
    if (error) {
        console.error(error);
        return;
    }
 
    // set database
    db = client.db("testDbCrypto");
    console.log("Database connected");
 
    // ROUTES
    
    //ENCRYPT PASSWORD
    app.get("/encrypt/:password", async function (request, result) {
        // get password from URL
        const password = request.params.password;
    
        // random 16 digit initialization vector
        const iv = crypto.randomBytes(16);
    
        // encrypt the string using encryption algorithm, private secretKey and initialization vector
        const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
        let encryptedData = cipher.update(password, "utf-8", "hex");
        encryptedData += cipher.final("hex");
    
        // convert the initialization vector to base64 string
        const base64data = Buffer.from(iv, 'binary').toString('base64');
        
        // save encrypted string along wtih initialization vector in database
        await db.collection("strings").insertOne({
            iv: base64data,
            encryptedData: encryptedData
        });
    
        // show the encrypted password
        result.send(encryptedData);
    });

   // DECRYPT PASSWORD
   app.get("/decrypt/:encryptedDataValue", async function (request, result) {
    // get encrypted text from URL
    const encrypted = request.params.encryptedDataValue;

    // check if text exists in database
    const obj = await db.collection("strings").findOne({
        encryptedData: encrypted
    });

    if (obj == null) {
        result.status(404).send("Not found");
        return;
    }

    // convert initialize vector from base64 to buffer
    const origionalData = Buffer.from(obj.iv, 'base64') 

    // decrypt the string using encryption algorithm and private secretKey
    const decipher = crypto.createDecipheriv(algorithm, secretKey, origionalData);
    let decryptedData = decipher.update(obj.encryptedData, "hex", "utf-8");
    decryptedData += decipher.final("utf8");

    // display the decrypted string
    result.send(decryptedData);
});

    

    // route to show all encrypted passwords
    app.get("/", async function (request, result) {
        // get all data from database
        const data = await db.collection("strings")
            .find({})
            .sort({
                _id: -1
            }).toArray();
    
        // render index.ejs
        result.render("index", {
            data: data
        });
    });


    app.listen(3000, function(err){
        if(err) throw error
        console.log("server running at port 3000...")
    })
 
});





