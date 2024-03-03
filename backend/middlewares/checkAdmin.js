const jwt = require("jsonwebtoken");

const checkAdmin = ()=>(req, res, next) => {
    const token  = req.header("x-access-token");

    if (!token) {
        return res.status(401).json({ error: "You are not logged in!!!" });
     }  
     try {
        const verified = jwt.verify(token,process.env.jwtsecret);
        
        if (!verified) {
            return res.status(401).json({ error: "You are not logged in!!!" });
        }

        if (verified.role !== 'admin') {
            return res.status(403).json({ error: "You do not have permission to access this resource." });
        }

        req.user = verified;
        next();
    } catch (error) {
        res.status(400).json({ error: "Invalid Token" });
    }
};  

module.exports = checkAdmin;