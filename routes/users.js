var express = require('express')
var router = express.Router()
const otplib = require('otplib')
const userController = require('../controllers/userControllers')
// const userVerify = require('../middlewares/userVerify')
// const addressController = require('../controllers/addressControllers')

router.get('/', userController.homePage)
router.get('/index', userController.indexPage)
router.get('/signup', userController.userSignup)
router.get('/login', userController.loginPage)
// router.get('/singleProduct/:id', userController.userSingleProduct)
// router.get('/home', userController.userHome)
router.post('/signup', userController.postSignup)
router.post('/login', userController.postLogin)
router.get('/logout', userController.logout)
router.post("/emailexists", userController.emailVerify);
router.post("/sendotp", userController.sendOtp);
router.post("/verifyotp", userController.verifyOtp);

// router.get('/forgotPass', userController.forgotPass)
// router.post('/postForgotPass', userController.postForgotPass)
// router.post('/otp', userController.otpLogin)
// router.get('/otp', (req, res) => {
//   res.render('users/otp', {other:true})
// })
// router.get('/verify', userController.verify)
// router.post('/verify', userController.postVerify)
// router.post('/removeItem', userController.removeItem)
// router.get('/Orders', userController.orders)

module.exports = router;