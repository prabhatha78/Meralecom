var express = require('express');
var router = express.Router();
const adminController = require('../controllers/admin-controller')
const usercontroller = require('../controllers/user-controller')
const { uploadCategory, uploadProduct, uploadIngredient } = require('../middleware/image-upload')
const deleteImage = require('../controllers/delete-controller')
const verifyAdmin = require('../middleware/adminAuth');
const { resolve } = require('express-hbs/lib/resolver');


/* GET admin page. */
router.get('/', function (req, res, next) {
    if (req.session.adminloggedIn) {
        res.redirect('/admin/dashboard')
    } else {
        res.redirect('/admin/login')
    }
})

router.get('/login', function (req, res) {
    if (req.session.adminloggedIn) {
        res.redirect('/');
    }
    else {
        res.render('admin/admin-login', { erro: req.session.adminloginErr, admin: true })
        req.session.adminloginErr = false;
    }
});



router.post('/login', function (req, res) {
    adminController.adminLogin(req.body).then((response) => {
        if (response.status) {
            req.session.adminloggedIn = true
            req.session.admin = response.admin
            res.redirect('/admin/dashboard')
        } else {
            req.session.adminloginErr = true;
            res.redirect('/admin')

        }
    })
})

router.get('/dashboard', verifyAdmin, async function (req, res) {
    if (req.session.adminloggedIn) {
        let monthData = await adminController.getOrdersByMonth()
        console.log(monthData);
        let dashboard = await adminController.dashboardCount()
        let orderTotal = await adminController.getOrderTotal()
        let orderquantity = await adminController.getOrdersQuantity()
        console.log(orderquantity);
        res.render('admin/dashboard', { admin: true, dashboard, monthData, orderTotal,orderquantity })
    }
    else {
        res.redirect('/')
    }
})

router.get('/order-list', verifyAdmin, async (req, res) => {
    let order = await adminController.getOrder()
    res.render('admin/order-list', { admin: true, order });
})

router.get('/order-details/:id', verifyAdmin, async function (req, res) {
    const order = await usercontroller.getOrder(req.params.id)
    const products = await usercontroller.getOrderProducts(req.params.id)
    res.render('admin/order-detail', { admin: true, order, products })
})



router.get('/category-list', verifyAdmin, function (req, res) {
    adminController.getAllCategory().then((category) => {
        res.render('admin/category-list', { category, admin: true, err: req.session.categoryExist })
    })

})

router.post('/add-category', verifyAdmin, uploadCategory, function (req, res) {
    req.body.image = req.files.image;
    adminController.addCategory(req.body).then((response) => {

        if (response.categoryExist) {
            req.session.categoryExist = true
            res.redirect('/admin/category-list');
        } else {
            req.session.categoryExist = false
            res.redirect('/admin/category-list');
        }
    })

})

router.get('/edit-category/:id', verifyAdmin, async (req, res) => {
    let category = await adminController.getAllCategory()
    adminController.getCategoryById(req.params.id).then((cat) => {
        res.render('admin/edit-category', { cat, category, admin: true })
    })
})


router.post('/edit-category/:id', verifyAdmin, uploadCategory, async (req, res) => {
    if (req.files.image == null) {
        req.body.image = await adminController.fetchCategoryImage(req.params.id)
    } else {
        existImage = await adminController.fetchCategoryImage(req.params.id)
        req.body.image = req.files.image;
        deleteImage.deleteFile(existImage[0].path)
    }
    adminController.updateCategory(req.params.id, req.body).then(() => {
        res.redirect('/admin/category-list')
    })
})


router.get('/ingredient-list', verifyAdmin, function (req, res) {
    adminController.getAllIngredient().then((ingredient) => {
        res.render('admin/ingredient-list', { ingredient, admin: true, err: req.session.ingredientExist })
    })
})

router.post('/add-ingredient', verifyAdmin, uploadIngredient, function (req, res) {
    req.body.image = req.files.image;
    adminController.addIngredient(req.body).then((response) => {
        if (response.ingredientExist) {
            req.session.ingredientExist = true
            res.redirect('/admin/ingredient-list')
        } else {
            req.session.ingredientExist = false
        res.redirect('/admin/ingredient-list')
        }
    })
})

router.get('/edit-ingredient/:id', verifyAdmin, async function (req, res) {
    let ingredient = await adminController.getAllIngredient()
    adminController.getIngredientById(req.params.id).then((ingre) => {
        res.render('admin/edit-ingredient', { ingre, ingredient, admin: true })
    })
})

router.post('/edit-ingredient/:id', verifyAdmin, uploadIngredient, async (req, res) => {
    if (req.files.image == null) {
        req.body.image = await adminController.fetchIngredientImage(req.params.id)
    } else {
        existImage = await adminController.fetchIngredientImage(req.params.id)
        req.body.image = req.files.image;
        deleteImage.deleteFile(existImage[0].path)
    }

    adminController.updateIngredient(req.params.id, req.body).then(() => {
        res.redirect('/admin/ingredient-list')
    })
})

router.get('/product-list', verifyAdmin, (req, res) => {
    adminController.getAllProduct().then((product) => {
        res.render('admin/product-list', { product, admin: true })
    })
})


router.get('/add-product', verifyAdmin, async (req, res) => {
    let category = await adminController.getAllCategory()
    let ingredient = await adminController.getAllIngredient()
    res.render('admin/add-product', { category, ingredient, admin: true })
})

router.post('/add-product', verifyAdmin, uploadProduct, function (req, res) {
    req.body.status = true
    req.body.images = [req.files.image1[0], req.files.image2[0], req.files.image3[0]]
    adminController.addProduct(req.body).then((response) => {
        res.redirect('/admin/product-list');
    })
})

router.get('/delete-product/:id', verifyAdmin, function (req, res) {
    let productId = req.params.id
    adminController.deleteProduct(productId).then((response) => {
        res.redirect('/admin/product-list')
    })
})

router.get('/edit-product/:id', verifyAdmin, async (req, res) => {
    let product = await adminController.getProduct(req.params.id)
    let category = await adminController.getAllCategory()
    let ingredient = await adminController.getAllIngredient()
    res.render('admin/edit-product', { product, category, ingredient, admin: true })
})


router.post('/edit-product/:id', verifyAdmin, uploadProduct, async function (req, res) {
    if (req.files.image1 == null) {
        image1 = await adminController.getProductImage(req.params.id, 0)
    } else {
        exist = await adminController.getProductImage(req.params.id, 0);
        image1 = req.files.image1[0];
        deleteImage.deleteFile(exist.path)


    }

    if (req.files.image2 == null) {
        image2 = await adminController.getProductImage(req.params.id, 1)
    } else {
        exist = await adminController.getProductImage(req.params.id, 1)
        image2 = req.files.image2[0];
        deleteImage.deleteFile(existImage.path)

    }

    if (req.files.image3 == null) {
        image3 = await adminController.getProductImage(req.params.id, 2)
    } else {
        exist = await adminController.getProductImage(req.params.id, 2)
        image3 = req.files.image3[0];
        deleteImage.deleteFile(existImage.path)

    }

    req.body.images = [image1, image2, image3]

    adminController.updateProduct(req.params.id, req.body).then(() => {
        res.redirect('/admin/product-list')
    })
})


router.get('/user-list', verifyAdmin, async function (req, res) {
    let user = await adminController.getAllUsers()
    res.render('admin/user-list', { user, admin: true })
})

router.get('/delete-user/:id', verifyAdmin, function (req, res) {
    let userId = req.params.id
    adminController.blockUser(userId).then((response) => {
        res.redirect('/admin/user-list')
    })
})

router.get('/unblock-user/:id', verifyAdmin, function (req, res) {
    let userId = req.params.id
    adminController.unblockUser(userId).then((response) => {
        res.redirect('/admin/user-list')
    })
})

router.get('/coupon-list', verifyAdmin, async function (req, res) {
    let coupons = await adminController.getAllCoupon()
    res.render('admin/coupons', { coupons, admin: true })
})


router.post('/add-coupon', verifyAdmin, function (req, res) {
    if (req.session.adminloggedIn) {
        adminController.addCoupon(req.body).then((response) => {
            res.redirect('/admin/coupon-list')
        })
    } else {
        res.redirect('/admin')
    }
})

router.get('/edit-coupon/:id', verifyAdmin, async function (req, res) {
    let allCoupons = await adminController.getAllCoupon()
    adminController.getCoupon(req.params.id).then((coupon) => {
        coupon.expiry_date = coupon.expiry_date.toString()
        res.render('admin/edit-coupon', { coupon, allCoupons, admin: true })
    })
})

router.post('/edit-coupon/:id', verifyAdmin, async (req, res) => {
    adminController.updateCoupon(req.params.id, req.body).then(() => {
        res.redirect('/admin/coupon-list')
    })
})

router.get('/delete-coupon/:id', verifyAdmin, function (req, res) {
    let couponId = req.params.id
    adminController.deleteCoupon(couponId).then((response) => {
        res.redirect('/admin/coupon-list')
    })
})


router.get('/change-order-status/:orderId/:status', verifyAdmin, function (req, res) {
    adminController.changeOrderstatus(req.params.orderId, req.params.status).then((response) => {
        res.json({ status: true })
    })
})


router.post('/sales-report',verifyAdmin,(req,res)=>{
    adminController.gerSalesReportInfo(req.body).then((response)=>{
        if(response.status){
            res.json({status:true})
        } else {
            res.json({status:false})
        }
    })
})

router.get('/logout', function (req, res) {
    req.session.adminloggedIn= false;
    res.redirect('/admin')
})





module.exports = router;