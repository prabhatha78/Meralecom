const db = require('../config/connection')
const collection = require('../config/collection')
const { ObjectId } = require('bson')


const verifyUser = async (req, res, next) => {
    if (req.session.userloggedIn) {
        let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectId(req.session.user._id) })
        if (user.status) {
            next()
        } else {
            res.redirect('/log-out')
        }
    } else {
        res.redirect('/login');
    }
}


module.exports = verifyUser;