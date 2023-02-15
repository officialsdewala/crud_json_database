const express=require('express');
require('dotenv').config()

const app=express();

const port =process.env.PORT || 4000;

app.use(express.json());
app.use(express.urlencoded());

app.use(require("./middleware/authorize"))

app.use('/',require('./routes/index'));

app.listen(port,()=>{
    console.log(`server is up on port ${port}.`);
})




