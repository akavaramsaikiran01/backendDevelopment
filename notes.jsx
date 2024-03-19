const express=require("express");
const router=express.Router();
const fetchuser=require('../middleware/fetchuser.jsx');
const Note=require("../Models/Note.jsx");
const { body, validationResult } = require('express-validator');

//#########Route 1 :  get notes using :get   /ai/notes/getnotes
router.get('/getnotes',fetchuser,async (req,res)=>{
    try
    {
        const notes=await Note.find({user:req.user.id})
         res.send(notes);
    }
    catch(err)
    {
     console.error(err.message);
     res.status(500).send("Internal Server Error")
    }
})


//#########  Route 2 :   create notes using :POST   /ai/notes/getnotes
router.post('/addnotes',fetchuser,[                                      // EXPRESS VALIDATION
    body('title','enter a valid title').isLength({ min: 3 }),      // if name length is lessthan 3 then error message prints as enter a valid name
    body('description','enter valid description').isLength({ min: 5 })    // if name description is lessthan 5    then error message prints as enter a valid name
]
,async (req,res)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } 
    try
    {
       const {title,description,tag}=req.body;
       const note=new Note({
        title,
        description,
        tag,
        user:req.user.id
       })
       const savedNote=await note.save();
       res.json(savedNote);

    }
    catch(err)
    {
     console.error(err.message);
     res.status(500).send("Internal Server Error")
    }
})

// ######   Route 3 : Update an existing note using PUT :"api/auth/updatenote" login required
router.put('/updatenote/:id', fetchuser, async (req, res) => {
    try {
        let { title, description, tag } = req.body;
        const newNote = {};

        if (title) newNote.title = title;
        if (description) newNote.description = description;
        if (tag) newNote.tag = tag;

        let note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).send("Not found");
        }

        if (note.user.toString() !== req.user.id) {
            return res.status(401).send("Not allowed");
        }

        note = await Note.findByIdAndUpdate(req.params.id, { $set: newNote }, { new: true });
        res.json({ note });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Internal Server Error");
    }
});

// ######   Route 4 : delete an existing note using delete :"api/auth/deletenote" login required
router.delete('/deletenote/:id', fetchuser, async (req, res) => {
    try {
            let note = await Note.findById(req.params.id);
            
            // checking if note present in the database or not
            if (!note) 
            {
                return res.status(404).send("Not found");
            }
            // allow deletion <=> user owns this note  (userID present in note should equal to the userID of requesting person)
            if (note.user.toString() !== req.user.id) 
            {
                return res.status(401).send("Not allowed");
            }

            note = await Note.findByIdAndDelete(req.params.id);
            res.json({"success":"Delete successfully", note:note });
    } 
    catch (err) {
        console.error(err.message);
        res.status(500).send("Internal Server Error");
    }
});
module.exports=router;