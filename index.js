const express = require("express")
const app = express()
const bcrypt = require("bcrypt")
const MongoClient = require('mongodb').MongoClient
const mongodb =  require("mongodb")
const cookieParser = require("cookie-parser");

const jwt = require("jsonwebtoken");
const verify = require("jsonwebtoken");

const CORS = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const PORT = process.env.PORT 


// create connection
async function createconnections() {
    const MONGO_URL = process.env.MONGO_URL
    const client = new MongoClient(MONGO_URL)
    await client.connect();
    console.log("connected")
    return client;
 }






app.use(express.json())
app.use(cookieParser())
app.get("/",(req,res)=>{
    res.send("hi all")
})
app.use(CORS())



// token validation
const validateToken = async (req, res, next) => {

    try {
      const token = req.header("access-token");
      if (!token) return res.status(403).send("Access denied.");
  
      const decoded = await jwt.verify(token,process.env.KEY);
      req.user = decoded;
      next();
  } catch (error) {
      res.status(400).send("Invalid token");
  }
    };
  

//registration
app.post("/register" , async (request,response)=>{
    const client= await createconnections()
   
   const {name , email , username , password} = request.body;

   const result1 = await client.db("notesdatabase").collection("people").findOne({username:username})
   if(!result1)
   {
    const salt = await bcrypt.genSalt(10)
    const hashpass =await bcrypt.hash(password,salt)
    
    const result = await client.db("notesdatabase").collection("people").insertOne({name , email , username , hashpass})
    console.log(result)
    response.send("registration successful")
   }
   else{
       response.send("user already exists")
   }

})

//login code
app.post("/login" , async(request,response)=>{
    const client= await createconnections()
   
   const{username,password} = request.body;
   
   const result = await client.db("notesdatabase").collection("people").findOne({username:username})
 
   if(!result) 
   {
       response.send("user not exist")
   }
   else
   {
   const hash = result.hashpass
  
   const ispasswordmatch = await bcrypt.compare(password,hash)
 
    if(!ispasswordmatch){
        response.send("username and password not match")
    }
    else{
        // const accestoken = await createTokens(result)
        // console.log(accestoken)

        const accessToken =  await jwt.sign(
            { id: result.username },
            process.env.KEY,
            {
              expiresIn: "2h"
            }
          );
        response.json({messege:"valid logged in",token:accessToken,result})

        

    }
}
});




//opeartions on data base
app.get("/getuser", async(request,response)=>{
    const client = await createconnections()
    const result = await client.db("notesdatabase").collection("people").find({}).toArray()
    response.send(result)

})
app.post("/insertToinsta", async(request,response)=>{
    const client = await createconnections()
    const add_data = request.body
    const result = await client.db("notesdatabase").collection("notes").insertMany([add_data])
    response.send(result)
})
app.get("/getFrominsta", async(request,response)=>{
    const client = await createconnections()
    const result = await client.db("notesdatabase").collection("notes").find({}).toArray()
    response.send(result)

})
app.delete("/deleteFrominsta/:id" , async(request,response)=>{
const id = request.params.id
const client = await createconnections()
const user= await client.db("notesdatabase").collection("notes").deleteOne({_id: new mongodb.ObjectId(id)})
   console.log(id)
   console.log(user)
   response.send(user)
})
app.put("/patchinsta/:id", async(request, response) => {
    console.log(request.params);
 
    const id = request.params.id;
    const client = await createconnections();
    
    const user= await client.db("notesdatabase").collection("notes").updateOne({_id:new mongodb.ObjectId(id)},{$set:{"name":request.body.name,"pic":request.body.pic}})
    // console.log(user)
    response.send(user)
 
  });
 




app.listen(PORT, () => console.log("server is started in port 1234"));
