const userController = require('../controllers/userControllers')
const cartController = require('../controllers/cartController')
const orderController = require('../controllers/orderControllers')
const couponController = require('../controllers/couponControllers')
const otplib = require('otplib')
var express = require('express')
var router = express.Router()


//get leone user pages
router.get('/', userController.homePage)
router.get('/index', verify, userController.indexPage)
router.get('/login', userauth, userController.loginPage)
router.post('/login', userauth, userController.postLogin)
router.get('/signup', userauth, userController.userSignup)
router.post('/signup', userauth, userController.postSignup)
router.get('/logout', verify, userController.logout)
router.get('/single-product/:id', userController.userSingleProduct)
router.get('/profile', userController.getProfile)

//otp route
router.get('/otp', (req, res) => {
    res.render('users/otp', {other:true})
})
router.post('/sendotp', userController.sendOtp);
router.post('/otp', userController.otpLogin)
router.post('/verifyotp', userController.verifyOtp)

//add-to-cart route setting
router.get('/addtoCart/:id', cartController.cartCount,cartController.addtoCart)   //userController.isLogin,
router.get('/cart', cartController.cartCount, cartController.getCartProducts)
router.post('/changeProductQuantity', cartController.changeProductQuantity)
router.post('/removeItem', cartController.removeItem)
router.get('/product-size-selector', cartController.productSizeSelector)
router.get('/getCartTotals' , cartController.getCartTotals)

//verify route
router.get('/checkLogin', cartController.checkLogin)
router.post('/emailexists', userController.emailVerify)

// Proceed to checkout
router.get('/address', userController.isLogin, userController.savedAddressget)
router.post('/address', userController.deliveryAddressPost)
router.get('/savedAddress', userController.isLogin, cartController.cartCount, userController.deliveryAddress)
router.post('/savedAddress', userController.savedAddressPost)
router.get('/editSavedAddress/:id', cartController.cartCount, userController.editSavedAddress)
router.post('/editSavedAddress/:id', userController.editSavedAddressPost)
router.delete('/deleteAddress/:id', userController.deleteAddress)

//order controller
router.get('/orderPlaced', orderController.orderPlacedCod)
router.get('/Orders', userController.isLogin, cartController.cartCount, orderController.orders)
router.get('/viewOrderProducts/:id', userController.isLogin, cartController.cartCount, orderController.viewOrderProducts)
router.get('/cancel-order/', userController.isLogin,orderController.cancelOrder)

//coupon controller
router.post('/apply-coupon',couponController.applyCoupon)

//payment controller
router.post('/verify-payment', userController.paymentVerify)
router.get('/payment-failed', userController.paymentFailed)

router.get('/return-order/',userController.isLogin,orderController.returnOrder)

//middleware for preventing loading for strangers
function userauth(req, res, next) {
    if (req.session && req.session.user && req.session.userloggedIn) {
        res.redirect("/index")
    } else {
        next()
    }
}
function verify(req, res, next) {
    if (req.session && req.session.user && req.session.userloggedIn) {
        next();
    } else {
        res.redirect("/login")
    }
}

module.exports = router;