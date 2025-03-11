import jwt from 'jsonwebtoken';

const isLoggedIn=(req,res,next)=>{
        // for get the header
        const authHeader=req.headers['authorization'] || req.headers['Athorization'] ;
        if (!authHeader) {
                // 401 unauthorize
                return res.status(401).json({
                        status: false,
                        message:"No token found please Login "
                }) 
        }
        const token=authHeader.split(' ')[1];
    
        try {
            const decoded = jwt.verify(token,process.env.JWT_SECRET);
            req.decoded=decoded;
            next(); 

        }
        catch (error) {
                return res.status(401).json({
                                status: error,
                                message:"invalide token please Log in again"
                        })
        }
        


}

export default isLoggedIn;