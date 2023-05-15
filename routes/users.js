var express = require('express')
var router = express.Router()
const otplib = require('otplib')
const userController = require('../controllers/userControllers')
// const userVerify = require('../middlewares/userVerify')
const cartController = require('../controllers/cartController')

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

router.get('/', userController.homePage)
router.get('/index', verify, userController.indexPage)
router.get('/signup', userauth, userController.userSignup)
router.get('/login', userauth, userController.loginPage)
router.get('/single-product/:id', userController.userSingleProduct)
router.post('/signup', userauth, userController.postSignup)
router.post('/login', userauth, userController.postLogin)
router.get('/logout', verify, userController.logout)
router.post("/emailexists", userController.emailVerify);
router.post("/sendotp", userController.sendOtp);
router.post("/verifyotp", userController.verifyOtp);
router.post('/otp', userController.otpLogin)
router.get('/otp', (req, res) => {
  res.render('users/otp', {other:true})
})
//add-to-cart route setting
router.get('/addtoCart/:id',cartController.cartCount,cartController.addtoCart)   //userController.isLogin,
router.get('/cart',cartController.cartCount,cartController.getCartProducts)
// router.post('/changeProductQuantity',cartController.changeProductQuantity)
// router.post('/removeItem',cartController.removeItem)
router.get('/product-size-selector',cartController.productSizeSelector)

module.exports = router;