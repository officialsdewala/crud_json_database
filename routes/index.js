const fs = require('fs/promises');
const path = require('path');
const express = require('express');
const multer=require('multer');

const router = express.Router();
const db = path.join(process.cwd(), './db.json');
const uploadPath = path.join(process.cwd(), 'public','profile_pic');


//defining the custom storage for multer
const storage=multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,uploadPath);
    },
    filename:function(req,file,cb){
            cb(null,Date.now()+path.extname(file.originalname));
    }
})

//filter the file by extension
function fileFilter(req,file,cb){
    try{
        const acceptedExtension=['.jpg','.png', '.gif', '.webp','.bmp'];
        const fileExtension=path.extname(file.originalname).toLocaleLowerCase();
        cb(null,acceptedExtension.includes(fileExtension));
    }catch(err){
        cb(err);
    }    
}


//create an instance of multer by passing storage ,limits and filefilter 
const upload=multer({
    storage:storage, // setting the custom storage 
    limits:{
        fieldSize : 2 * 1024 * 1024, //max file size is 2mb
    },
    fileFilter:fileFilter  //filtering and ignoring the file by its extension
});

//getting all the employee list
router.get('/emp', async (req, res) => {
    try{
        const fp = await fs.open(db);
        const data = await fp.readFile('utf-8');
        const json = JSON.parse(data);
        res.json(json);
        await fp.close();
    }catch(err){
        res.json({error:err.code});
    }

})

//getting employee by its id
router.get('/emp/:id', async (req, res) => {
    let fp;
    try{
        fp = await fs.open(db);
        const data = await fp.readFile('utf-8');
        const json = JSON.parse(data);
        const id=req.params.id;
        
        const emp=json.find(v=>v.id == id)

        emp ?  res.json(emp) : res.status(404).json({description:"Employee not found."});
        
    }catch(err){
        res.json({error:err.code});
    }finally{
        await fp.close();
    }

})

//update employee by its id
router.put('/emp/:id', async (req, res) => {
    let fp;
    try{
        fp = await fs.open(db);
        const data = await fp.readFile('utf-8');
        const json = JSON.parse(data);
        const id=req.params.id;
        
        let empIndex=json.findIndex(v=>v.id == id)

        if(empIndex === -1){
           return  res.status(404).json({description:"Employee not found."})
        }
        const updatedEmp={...json[empIndex],...req.body};
        json.splice(empIndex,1,updatedEmp);

        await fs.writeFile(db,JSON.stringify(json));
        res.json(updatedEmp);
    }catch(err){
        console.log(err);
        res.json({error:err.code});
    }finally{
        await fp.close();
    }

})

//create a new employee
router.post('/emp', async (req, res) => {
    try {
        const data = await fs.readFile(db,{ encoding: 'utf-8' });
        await fs.truncate(db);
        const json = JSON.parse(data);    
        let prevId;

        //create an id 
        if(json && json instanceof Array  && json.length){
            prevId=json[json.length -1].id;
        }else{
            prevId=0;
        }        

        const payload={id:prevId+1,...req.body}

        json.push(payload);

        await fs.writeFile(db,JSON.stringify(json));
        res.json(payload);
    } catch (err) {
        res.json({error:err.code});
    }
})

//remove employee by id
router.delete('/emp/:id', async (req, res) => {
    let fp;
    try{
        fp = await fs.open(db);
        const data = await fp.readFile('utf-8');
        const json = JSON.parse(data);
        const id=req.params.id;
        
        let empIndex=json.findIndex(v=>v.id == id)

        if(empIndex === -1){
           return  res.status(404).json({description:"Employee not found."})
        }

        const deletedEmp=json[empIndex];
        json.splice(empIndex,1);

        try {
            if(deletedEmp.profilePic){
                await fs.rm(path.join(process.cwd(),deletedEmp.profilePic))
            }
        } catch (error) {
            if(!(error.code === "ENOENT")){   //ENOENT - Error NO ENTry  or File not found
                throw error;
           }
        }

        await fs.writeFile(db,JSON.stringify(json));
        // return  res.json({description:"Employee deleted successfully."})
        return res.json(deletedEmp);
    }catch(err){
        console.log(err);
        res.json({error:err.code});
    }finally{
        await fp.close();
    }
})

//create or update the profile pic of the user by its id
router.put('/emp/:id/profilePic',upload.single('profilePic') ,async (req, res) => {
    let fp;
    try{
        fp = await fs.open(db);
        const data = await fp.readFile('utf-8');
        const json = JSON.parse(data);
        const id=req.params.id;
        const uploadFile=path.join(process.cwd(),'public','profile_pic');


        //check if the appropriate file is given or not
        //if there is no file it means the file filter has ignored the file or bad file is given
        if(!req.file){
           return  res.status(400).json({description:"Please give an appropriate image format. eg. ['.jpg','.png', '.gif', '.webp','.bmp']"})
        }
        
        let empIndex=json.findIndex(v=>v.id == id)
  
        //if the given user is not exist
        if(empIndex === -1){
            await fs.rm(path.join(uploadFile,req.file.filename));
           return  res.status(404).json({description:"Employee not found."});
        }

        //if user have already set any profile pic
        //and if the file is not exist then just update the field in the database by handling the error
        try {
            if(json[empIndex].profilePic){
                await fs.rm(path.join(process.cwd(),json[empIndex].profilePic));
            }
        } catch (error) {
           if(!(error.code === "ENOENT")){   //ENOENT - Error NO ENTry  or File not found
                throw error;
           }
        }
        
        //update the field in object and remove the previous one
        const updatedEmp={...json[empIndex],profilePic:path.join('public','profile_pic',req.file.filename)};
        json.splice(empIndex,1,updatedEmp);

        //save the updated fields in the database
        await fs.writeFile(db,JSON.stringify(json));
        res.json(updatedEmp);
    }catch(err){
        console.log(err);
        res.json({error:err.code});
    }finally{
        await fp.close();
    }


})

//authenticate the user and generate a token
router.post('/login',require('../middleware/authenticate'));

module.exports = router;