var express = require('express');
const adminController = require('../controllers/admin-controller');
var router = express.Router();
const usercontroller = require('../controllers/user-controller')
const verify = require('../helpers/otp_authentication')
const payment = require('../helpers/payment')
const nodemailer = require('nodemailer');
const session = require('express-session');
const getInvoice = require('../helpers/invoice')
const verifyUser = require('../middleware/userAuth')


/* GET home page. */
router.get('/', async function (req, res, next) {
  if (req.session.userloggedIn) {
    const cartCount = await usercontroller.getCartCount(req.session.user._id)
    res.render('user/home', { user: req.session.user, cartCount })
  }
  else {
    res.render('user/home');
  }
});

router.get('/login', function (req, res) {
  if (req.session.userloggedIn) {
    res.redirect('/');
  }
  else {
    res.render('user/login', { user: req.session.user, erro: req.session.userloginErr });
    req.session.loginErr = false;
  }
});


router.post('/login', function (req, res) {
  usercontroller.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.userloggedIn = true
      req.session.user = response.user
      res.redirect('/')
    } else {
      req.session.userloginErr = true;
      res.redirect('/login')

    }
  })
})


router.get('/signup', (req, res) => {
  res.render('user/signup', { err: req.session.emailErr, error: req.session.contactErr })
  req.session.emailErr = false;
  req.session.contactErr = false;
})

router.post('/signup', function (req, res) {
  req.body.status = true
  req.session.newUser = req.body
  usercontroller.doSignup(req.body).then((response) => {
    if (response.emailExist) {
      req.session.emailErr = true;
      res.redirect('/signup')
    } else if (response.contactExist) {
      req.session.contactErr = true;
      res.redirect('/signup')
    } else {
      verify.generateOtp(response.email).then((response) => {
        req.session.otp = response.otp
        res.render('user/otp')
      })
    }
  })
})

router.post('/check-otp', (req, res) => {
  otp = req.body.otp
  user = req.session.newUser
  if (otp == req.session.otp) {
    usercontroller.addUser(user).then((response) => {
      res.redirect('/login')
    })
  } else {
    req.session.otpError = true
    res.render('user/otp', { otpErr: req.session.otpError })
    req.session.otpError = false;
  }
})

router.get('/log-out', function (req, res) {
  req.session.userloggedIn = false
  res.redirect('/')
})

router.get('/shop', async (req, res) => {
  const products = await adminController.getAllProduct()
  if (req.session.user) {
    const cartCount = await usercontroller.getCartCount(req.session.user._id)
    res.render('user/shop-all', { user: req.session.user, products, cartCount })
  } else {
    res.render('user/shop-all', { products })
  }
})


router.get('/category', async function (req, res) {
  const category = await adminController.getAllCategory()
  if (req.session.user) {
    const cartCount = await usercontroller.getCartCount(req.session.user._id)
    res.render('user/category', { category, user: req.session.user, cartCount })
  } else {
    res.render('user/category', { category })
  }
})


router.get('/ingredient', async function (req, res) {
  const ingredient = await adminController.getAllIngredient()
  if (req.session.user) {
    const cartCount = await usercontroller.getCartCount(req.session.user._id)
    res.render('user/ingredient', { ingredient, user: req.session.user, cartCount })
  } else {
    res.render('user/ingredient', { ingredient })
  }
})


router.get('/cat_based_list/:name', async function (req, res) {
  const category = await adminController.getCategory(req.params.name)
  const product = await usercontroller.productCategory(req.params.name)
  if (req.session.user) {
    const cartCount = await usercontroller.getCartCount(req.session.user._id)
    res.render('user/cat_based_list', { user: req.session.user, category, product, cartCount })
  } else {
    res.render('user/cat_based_list', { category, product })
  }
})

router.get('/ing_based_list/:name', async function (req, res) {
  const ingredient = await adminController.getIngredient(req.params.name)
  const product = await usercontroller.productIngredient(req.params.name)
  if (req.session.user) {
    const cartCount = await usercontroller.getCartCount(req.session.user._id)
    res.render('user/ing_based_list', { user: req.session.user, ingredient, product, cartCount })
  } else {
    res.render('user/ing_based_list', { ingredient, product })
  }
})

router.get('/product/:id', async function (req, res) {
  const product = await usercontroller.displayProduct(req.params.id)
  if (req.session.user) {
    const cartCount = await usercontroller.getCartCount(req.session.user._id)
    const wishlistStatus = await usercontroller.checkWishlist(req.params.id, req.session.user._id)
    const cartStatus = await usercontroller.checkCart(req.session.user._id, req.params.id)
    res.render('user/product', { user: req.session.user, product, cartCount, wishlistStatus, cartStatus })
  } else {
    res.render('user/product', { product })
  }
})

router.get('/cart', verifyUser, async function (req, res) {
  const cartItems = await usercontroller.getCartProducts(req.session.user._id)
  const cart = await usercontroller.getCart(req.session.user._id)
  const cartCount = await usercontroller.getCartCount(req.session.user._id)
  res.render('user/cart', { user: req.session.user, cartItems, cart, cartCount })
})


router.post('/add-to-cart/', verifyUser, (req, res) => {
  usercontroller.addToCart(req.body, req.session.user._id).then(() => {
    usercontroller.addToInvoice(req.body, req.session.user._id).then(() => {
      res.json({ status: true })
    })
  })

})


router.post('/change-product-quantity/', verifyUser, async (req, res) => {
  usercontroller.changeInvoiceQuantity(req.body).then((response) => {
    usercontroller.changeProductQuantity(req.body).then((response) => {
      if(response.warning){
        res.json({warning:true})
      } else {
      res.json(response)
      }
    })
  })
})

router.post('/remove-from-cart/', verifyUser, async (req, res) => {
  usercontroller.removeFromCart(req.body).then((response) => {
    res.json(response)
  })
})

router.get('/checkout', verifyUser, async (req, res) => {
  let user = await usercontroller.getUser(req.session.user._id)
  const cartItems = await usercontroller.getCartProducts(user._id)
  const cart = await usercontroller.getCart(user._id)
  const cartCount = await usercontroller.getCartCount(user._id)
  res.render('user/checkout', { user, cartItems, cart, cartCount })
})



router.post('/checkout', verifyUser, async (req, res) => {
  const cartItems = await usercontroller.getCartProducts(req.session.user._id)
  const cart = await usercontroller.getCart(req.session.user._id)
  const cartCount = await usercontroller.getCartCount(req.session.user._id)
  const user = await usercontroller.getAddress(req.body.addressId, req.session.user._id);
  let total = cart.finalTotal
  console.log(user);
  usercontroller.placeOrder(req.body, user, cart.products, cart).then((orderId) => {
    console.log(orderId);
    if (req.body.paymentMethod === 'COD') {
      usercontroller.changeOrderStatus(orderId, cart._id)
      res.json({ codSuccess: true })
    } else {
      usercontroller.generateRazorPay(orderId, total).then((response) => {
        res.json(response)
      })
    }
  })
})

router.post('/add-new-address', verifyUser, async (req, res) => {
  usercontroller.addAddress(req.body, req.session.user._id).then(() => {
    res.redirect('/checkout');
  })
})

router.post('/add-latest-address', verifyUser, async (req, res) => {
  usercontroller.addAddress(req.body, req.session.user._id).then(() => {
    res.redirect('/address');
  })
})

router.post('/apply-coupon', verifyUser, async (req, res) => {
  const cart = await usercontroller.getCart(req.session.user._id)
  const total = cart.finalTotal
  usercontroller.applyCoupon(req.body, req.session.user._id, total).then((response) => {
    if (response) {
      res.json({ status: true, response })
    } else {
      res.json({ status: false })
    }
  })
})

router.post('/remove-coupon', verifyUser, async (req, res) => {
  const cart = await usercontroller.getCart(req.session.user._id)
  const total = cart.finalTotal
  usercontroller.removeCoupon(req.body, req.session.user._id, total).then((response) => {
    if (response) {
      res.json({ status: true })
    } else {
      res.json({ status: false })
    }
  })
})

router.get('/order-success', verifyUser, (req, res) => {
  res.render('user/order-success', { user: req.session.user })
})

router.get('/orders',verifyUser, async (req, res) => {
  const orders = await usercontroller.getMyOrders(req.session.user._id)
  res.render('user/orders', { user: req.session.user, orders })
})

router.get('/view-order-details/:id', verifyUser, async (req, res) => {
  const order = await usercontroller.getOrder(req.params.id)
  const products = await usercontroller.getOrderProducts(req.params.id)
  res.render('user/view-order-details', { user: req.session.user, products, order })
})


router.post('/verify-payment', verifyUser, async (req, res) => {
  const cart = await usercontroller.getCart(req.session.user._id)
  usercontroller.verifyPayment(req.body).then(() => {
    usercontroller.changeOrderStatus(req.body['order[receipt]'],cart._id).then(() => {
      console.log('Payment successfull');
      res.json({ status: true })
    })
  }).catch((err) => {
    res.json({ status: false })
  })
})

router.get('/coupons',async (req, res) => {
  if (req.session.user) {
    const cartCount = await usercontroller.getCartCount(req.session.user._id)
    usercontroller.getAllCoupon().then((coupon) => {
    res.render('user/coupons', { user: req.session.user, coupon, cartCount })
    })
  } else {
    usercontroller.getAllCoupon().then((coupon)=>{
    res.render('user/coupons', { coupon })
    })
  }
})


router.post('/add-to-wishlist/:id', verifyUser, (req, res) => {
  usercontroller.addToWishlist(req.params.id, req.session.user._id).then((response) => {
    res.json({ status: true })
  })
})

router.get('/wishlist', verifyUser, (req, res) => {
  usercontroller.viewWishlist(req.session.user._id).then((wishlist) => {
    res.render('user/wishlist', { user: req.session.user, wishlist })
  })
})

router.get('/account', verifyUser, (req, res) => {
  res.render('user/account', { user: req.session.user })
})

router.get('/profile', verifyUser, async (req, res) => {
  let user = await usercontroller.getUser(req.session.user._id)
  res.render('user/profile', { user })
})

router.post('/update-profile', verifyUser, (req, res) => {
  usercontroller.updateProfile(req.body).then((response) => {
    res.json({ status: true })
  })
})


router.get('/invoice/:id', verifyUser, (req, res) => {
  usercontroller.getOrder(req.params.id).then(async (order) => {
    let invoiceDetails = await usercontroller.invoiceDetails(req.params.id)
    let invoice = await getInvoice(order, invoiceDetails);
    res.json({ status: true, invoice })
  })
})

router.get('/address', verifyUser, async (req, res) => {
  let user = await usercontroller.getUser(req.session.user._id)
  res.render('user/address', { user })
})

router.get('/cancel-order/:id', verifyUser, (req, res) => {
  usercontroller.cancelOrder(req.params.id).then((response) => {
    res.json({ status: true })
  })
})

router.post('/change-password', verifyUser, (req, res) => {
  usercontroller.changePassword(req.session.user._id, req.body).then((response) => {
    if (response.changePassword) {
      res.json({ changePassword: true })
    } else if (response.enterPassword) {
      res.json({ enterPassword: true })
    }
    else if (response.minimumlength) {
      res.json({ minimumlength: true })
    } else if (response.mismatch) {
      res.json({ mismatch: true })
    } else if(response.failed) {
      res.json({failed:true})
    }
  })
})

router.get('/delete-address/:id',verifyUser,(req,res)=>{
  usercontroller.deleteAddress(req.params.id,req.session.user._id).then((response)=>{
    res.json({status:true})
  })
})

router.post('/edit-address',verifyUser,(req,res)=>{
  usercontroller.editAddress(req.session.user._id,req.body).then((response)=>{
    res.redirect('/address')
  })
})





module.exports = router;
