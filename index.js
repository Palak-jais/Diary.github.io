require('dotenv').config()
const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const _=require("lodash");
const mongoose=require("mongoose");
const cookieParser=require("cookie-parser");
const session=require('express-session')
const bcrypt=require("bcryptjs")



mongoose.set("strictQuery", false);
const app=express();
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public'));
app.use(cookieParser())
app.use(session({
  
  secret:"i am palakjaiswal",
  resave:false,
  saveUninitialized:false,
  cookie:{
    expires:600000
  }
  }))

  app.use((req,res,next)=>{
    if(req.session.user && req.cookies.user_palak){
      res.redirect("/compose")
    }
    next()
  })
  var sessionChecker=(req,res,next)=>{
    if(req.session.user){
      next()
    }
    else
    {  
      return res.json("please login/register to acess")
      /* var error=new Error("user not logged in")
      next(error);*/
    }
  }
// connection to mongodbcloud atlus

const db=process.env.DB
mongoose.connect(db,{

useNewUrlParser: true, 
useUnifiedTopology: true    
 
}).then(()=>{
    console.log("connected")
}).catch((err)=>console.log(err));

//mongodb schema... 

var userSchema = new mongoose.Schema({
  username:{
    type:String,
    required:true,
    trim:true
  },
  email:{
    type:String,
    required:true,
    trim:true
  },
  password:{
    type:String,
    required:true,
    unique:true, 
  },
 posts: {
  type:Array,
  default:[]
},
title: {
  type:Array,
  default:[]
}
 
});

var User = mongoose.model('User', userSchema);



app.post('/homepage', async function (request, response){
  const{email,password}=request.body;
  const user=await User.findOne({email})
  if(!user) return response.status(400).json({msg:"user not exists please register"})
  
  const isMatch=bcrypt.compare(password,user.password)
  if(!isMatch) return response.status(400).json({msg:"Incorrect Password."})

  else{
    
    request.session.user=user;
    //console.log(request.session);
    //console.log(request.session.user);
  
    response.render("home",{
      userarray:user.posts 
  });  


  }
});

  
  


app.post('/home-page', async function (request, response){
  

  const{username,email,password}=request.body;
  const user=await User.findOne({email:email})
  if(user) return response.json("this email already exists.")
  if(password.length<6) return response.json("Password must be of atleast eight charactors")

   const passwordHash=await bcrypt.hash(password,10)
    const newUser=new User({
     username,email,password:passwordHash
  })
  //save user
  await newUser.save();
  request.session.user=newUser;
  //console.log(request.session);
  //console.log(request.session.user);
   console.log("you registered sucessfully");
   const userarray=request.session.user.posts;
  response.render("home",{
    userarray:userarray
    
});  



});

app.get("/",function(req,res){
  res.render("login")
 });
 app.get("/register",function(req,res){
   res.render("register")
 });
 app.get("/login",function(req,res){
   
   res.render("login")
 });
 app.get('/logout',(req,res)=>{
  req.session.destroy(function(){
    console.log("logged out");
  });
  res.redirect("/login")
 })
//check logged in or not...



app.get("/home",sessionChecker, async function (req,res){
  const user=await User.findOne({_id:req.session.user._id})
   //console.log(user.posts)
   const userarray=user.posts;
  res.render("home",{
  userarray:userarray })
});

app.get("/compose",sessionChecker,function(req,res){
  
    res.render("compose");
});

app.get("/about",sessionChecker,function(req,res){
  
  res.render("about");
});
app.get("/contact",sessionChecker,function(req,res){

  res.render("contact");
});
app.post("/compose",sessionChecker,function(req,res){
  
  res.redirect("/compose")
});



app.post("/send",async function(req,res){
    
 const id= req.session.user._id;
 
 let date = new Date().toLocaleDateString();
 var days= ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
 var day = days[new Date().getDay()];
 let time=new Date().toLocaleTimeString();

 var info=` ${day} ${date}  ${time}`;


 
            await  User.findOneAndUpdate({_id:id},{
             $push:{ posts:{"title":req.body.postTitle,
            "content":req.body.postBody,
            "time":info
          }
            }
            })
            
            res.redirect("/home")
            
            
          }
)

app.listen(3000,function(){
    console.log("listening");
});