const verifyAdmin = (req, res, next) => {
    if (req.session.adminloggedIn) {
        next()
    } else {
        req.session.adminloginErr = true;
        res.redirect('/admin')
    }
}


module.exports=verifyAdmin;

