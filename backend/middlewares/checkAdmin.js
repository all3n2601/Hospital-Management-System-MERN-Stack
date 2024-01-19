const checkAdmin = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(401).json({ error: "You Are Not Authorized to perform this Operation!!!" });
    }
    next();
};  

module.exports = checkAdmin;