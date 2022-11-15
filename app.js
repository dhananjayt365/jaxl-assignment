const express = require('express');
const path = require('path');
const app = express();
const fs = require('fs');
const cookieParser = require("cookie-parser");
const jwt = require('jsonwebtoken');
app.use(express.static('public'));
app.use(express.json());
app.use(cookieParser());

const dataPath = './user.json'

const saveAccountData = (data) => {
    const stringifyData = JSON.stringify(data)
    fs.writeFileSync(dataPath, stringifyData)
}

const getAccountData = () => {
    const jsonData = fs.readFileSync(dataPath)
    return JSON.parse(jsonData)   
}

const authorization = (req, res, next) => {
    const token = req.cookies.access_token;
    if (!token) {
      return res.sendStatus(403);
    }
    else{
        try {
            const data = jwt.verify(token, "YOUR_SECRET_KEY");
            const user = getAccountData();
            if(user.email != data.name){
              res.sendStatus(403);
            }
            else{
              req.email = data.email;
              return next();
            }
          } catch {
            return res.sendStatus(403);
          }
    }
    
  };

  const islogin  = (req, res, next) =>{
    const token = req.cookies.access_token;
    if (!token) {

      return next();
    }
    else{
        try {
            const data = jwt.verify(token, "YOUR_SECRET_KEY");
            const user = getAccountData();
            if(user.email != data.name){
              res.sendStatus(403);
            }
            else{
              req.email = data.email;
              res.redirect('/home')
            }
          } catch {
            return res.sendStatus(403);
          }
    }
  }




const port = 3000;

app.get('/',islogin,(req,res)=>{
    res.sendFile(__dirname + '/public/login.html');
})

app.get('/home',authorization,(req,res)=>{
    res.sendFile(__dirname + '/public/home.html');
})

app.get('/user',(req,res)=>{
    let data = getAccountData();
    delete data.timestamp;
    delete data.otp;
    res.send(data).status(201);
})

app.get('/req-otp',(req,res)=>{
    const data = getAccountData();
    const otp = Math.ceil(Math.random()*100000);
    const timestamp = Date.now();
    console.log(otp,timestamp);
    data['otp']=otp;
    data['timestamp']=timestamp;
    console.log("OTP is",otp);
    saveAccountData(data);
    res.send("done").status(200);
})

app.post('/verify-otp',(req,res)=>{
    // console.log(req.body);
    const otp = req.body.otp;
    const currentTime = Date.now();
    const data = getAccountData();
    if(data.email!=req.body.email){
        res.send("wrong credentials").status(401);
    }
    else if(data.otp != req.body.otp){
        res.send("wrong otp").status(401);
    }
    else if(currentTime - data.timestamp > 15*60*1000){
        const diff = currentTime-data.timestamp;
        console.log(diff);
        res.send("otp expired!").status(401);
    }
    else {
        const token = jwt.sign({ name:'lcs2019028@iiitl.ac.in' }, "YOUR_SECRET_KEY");
        return res
            .cookie("access_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            })
            .status(200)
            .json({ message: "Logged in successfully 😊 👌" });
        }
    
})

app.get("/logout", authorization, (req, res) => {
    return res
      .clearCookie("access_token")
      .status(200)
      .json({ message: "Successfully logged out 😏 🍀" });
  });

app.listen(port,()=>console.log(`server is running ${port}`));