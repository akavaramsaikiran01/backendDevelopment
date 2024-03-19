const express=require("express");
const router=express.Router();
const User=require("../Models/user.jsx");
const mongoose=require("mongoose");
const {Schema}=mongoose;

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET=`saikiranisagoodb$oy`;

const { body, validationResult } = require('express-validator');

//######### importing middleware 

const fetchuser=require('../middleware/fetchuser.jsx');
// ### create a User post: "/api/auth/createuser" no login required

router.post('/createuser',[                                               // EXPRESS VALIDATION
    body('name','enter a valid name').isLength({ min: 3 }),      // if name length is lessthan 3 then error message prints as enter a valid name
    body('email','enter a valid email').isEmail(),                 // if input is not in email formate error message prints as enter a valid name
    body('password','enter valid password').isLength({ min: 5 })    // if name PASSWORD is lessthan 5    then error message prints as enter a valid name
],async (req,res)=>{                      
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } 

   try
   {
         //check whether the email exist already
        let user=await User.findOne({email:req.body.email});
        if(user)
        {
            return res.status(400).json({error:"Sorry!  a user with email already exists"})
        }

        const salt = await bcrypt.genSaltSync(10);
        let securedPassword=await bcrypt.hashSync(req.body.password, salt);
        //create new user
        user= await User.create({                               //INSERTS IO DATABASE 
            name: req.body.name,
            password: securedPassword,
            email: req.body.email,
        })

        const data={
            user:{
                id:user.id
            }
        }
        const authToken = jwt.sign(data, JWT_SECRET);
        res.json({authToken});
        
        //   .then(user => res.json(user))
        //   .catch(err=>{console.log(err)
        // res.json({error: "please enter a valid email",message:err.message})});//If sane email entered twice then this error prints
   }
   catch(err)
   {
    console.error(err.message);
    res.status(500).send("Internal Server Error")
   }
})


// ### authenticate a user using POST: "/api/auth/login" login required

router.post('/loginuser',[                                               
          
    body('email','enter a valid email').isEmail(),                 
    body('password','password cannot be blank').exists()    
],async (req,res)=>{                      
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } 
    let {email,password}=req.body;
   try
   {
       
        let user=await User.findOne({email})  ;
        if(!user)
        {
            return res.status(400).json("please enter proper credentitials");
        }

        const passwordCompare=await bcrypt.compare(password,user.password);
        if(!passwordCompare)
        {
            return res.status(400).json("please enter proper credentials");
        }

        const data={
            user:{
                id:user.id
            }
        }
        const authToken = jwt.sign(data, JWT_SECRET);
        res.json({authToken});
    }
    catch(err)
    {
     console.error(err.message);
     res.status(500).send("Internal Server Error")
    }
 })

 //get logged in user details using : POST  "api/auth/getuser"   login required


 router.post('/getuser',fetchuser,async (req,res)=>{                      

    try 
    {
        let userId=req.user.id;
        const user=await User.findById(userId).select("-password");
        res.send(user)
    } 
    catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error")
    }
})

module.exports=router;