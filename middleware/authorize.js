const jwt=require('jsonwebtoken');

const secret=process.env.SECRET;
const user = "pankaj";
const password = "123";

module.exports=function(req,res,next){
    
    const token=req.headers.authorization;

    //if user is generating the token then don't do anything
    if(req.path.endsWith('login')){
        next();
        return;
    }

    if(!token){
        res.json({description:"Please provide bearer token."});
        return;
    }

    try{
       const decoded=jwt.verify(token.slice(7),secret); 
       if(decoded.data.username != user || decoded.data.password != password ){
            res.json({error:"Invalid user id or password."});
       }
    }catch(err){
        if(err instanceof jwt.TokenExpiredError){
            return res.json({error:"Token is expired please regenereate."});
        }

        if(err instanceof jwt.JsonWebTokenError ){
            return res.json({error:"Invalid web token."});
        }

        next(err);
    }
    next();
}


