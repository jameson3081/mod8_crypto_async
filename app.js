const express = require('express')
const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;
const crypto = require('crypto')
const algorithm = 'aes-256-cbc' //// encryption algorithm. secret secretKey is used for both encryption and decryption
const secretKey = "asfsafdsdsfdsafdsadsfdsfsdfsdsff" // // private secretKey

const app = express()
const dbUri = 'mongodb+srv://serverhost2:serverhosttest@cluster0.rngoxff.mongodb.net/?retryWrites=true&w=majority'
app.set("view engine", "ejs");

// connect with mongo DB server
MongoClient.connect(dbUri, function (error, client) {
    if (error) {
        console.error(error);
        return;
    }
 
    // set database
    db = client.db("testDbCrypto");
    console.log("'testDbCrypto' Database connected");
 
    // ROUTES
    
    //HASH PASSWORD
    app.get("/hash/:password",  (request, result) => {
        const password = request.params.password;

        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex')

        db.collection("account").insertOne({
            password: hashedPassword
        });

        result.send("HASHED PASSWORD:  " + hashedPassword)

    });


    //ENCRYPT address
    app.get("/encrypt/:address", async function (request, result) {
        // get address from URL
        const address = request.params.address;
    
        // random 16 digit initialization vector
        const iv = crypto.randomBytes(16);
    
        // encrypt the string using encryption algorithm, private secretKey and initialization vector
        const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
        let encryptedAddress = cipher.update(address, "utf-8", "hex");
        encryptedAddress += cipher.final("hex");
    
        // convert the initialization vector to base64 string
        const base64data = Buffer.from(iv, 'binary').toString('base64');
        
        // save encrypted string along wtih initialization vector in database
        await db.collection("shippingDetails").insertOne({
            iv: base64data,
            address: encryptedAddress
        });
    
        // show the encrypted address
        result.send("ENCRYPTED ADDRESS:  " + encryptedAddress);
    });

   // DECRYPT address
   app.get("/decrypt/:encryptedAddressValue", async function (request, result) {
    // get encrypted text from URL
    const encrypted = request.params.encryptedAddressValue;

    // check if text exists in database
    const obj = await db.collection("shippingDetails").findOne({
        address: encrypted
    });

    if (obj == null) {
        result.status(404).send("Not found");
        return;
    }

    // convert initialize vector from base64 to buffer
    const origionalData = Buffer.from(obj.iv, 'base64') 

    // decrypt the string using encryption algorithm and private secretKey
    const decipher = crypto.createDecipheriv(algorithm, secretKey, origionalData);
    let decryptedData = decipher.update(obj.address, "hex", "utf-8");
    decryptedData += decipher.final("utf8");

    // display the decrypted string
    result.send("DECRYPTED ADDRESS:  " + decryptedData);
});

    

    // route to show all encrypted address
    app.get("/", async function (request, result) {
        // get all data from database
        const data = await db.collection("shippingDetails")
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





