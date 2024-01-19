
const checkAccess = (req, res, next) => {
    if (req.user.role !== "admin" || req.user.role!== "doctor" || req.user.role!=="nurse") {
        return res.status(401).json({ error: "You Are Not Authorized to perform this Operation!!!" });
    }
    next();
};  

module.exports = checkAccess;