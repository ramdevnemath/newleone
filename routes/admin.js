var express = require('express')
var router = express.Router()
const productController = require('../controllers/productControllers')
const adminController = require('../controllers/adminControllers')
const userController = require('../controllers/userControllers')
const multer = require('multer')
const storage = multer.diskStorage({
  destination: function (req, files, cb) {
    cb(null, './public/admin/uploads/') // specify the folder where the uploaded files will be stored
  },
  filename: function (req, files, cb) {
    cb(null, Date.now() + 'Leone' + files.originalname) // specify the filename of the uploaded files
  }
})
const upload = multer({ storage: storage });


router.get('/login', adminauth, adminController.adminLogin)
router.post('/postLogin', adminController.postAdminLogin)
router.get('/products', verify, productController.getAllProducts)
router.get('/logout', verify, adminController.logout)
router.get('/add-product', productController.addProductPage)
router.post('/add-product', upload.array('image',3), productController.postProduct)
router.delete('/deleteProduct/:id', productController.deleteProduct)
router.delete('/deleteCategory/:id', productController.deleteCategory)
router.get('/edit-product/:id', productController.getEditProductPage)
router.post('/edit-product/:id', productController.editProduct)
router.get('/home', verify, adminController.getDashboard)
router.get('/users', adminController.userslist)
router.get('/block/:id', userController.blockUser)
router.get('/unblock/:id', userController.unBlockUser)
router.delete('/delete/:id', userController.deleteUser)
router.get('/add-category', adminController.addCategory)
router.post('/add-category', adminController.addCategoryPost)
router.get('/edit-category/:id', productController.editCategory)
router.post('/edit-category/:id', productController.postEditCategory)
router.get('/orders', adminController.viewOrders)
router.get('/orderedProducts/:id', adminController.orderedProducts)
router.post('/order-details/', adminController.orderStatus)
router.patch("/loadOrder", adminController.loadOrderData)

function previewImage(input) {
  if (input.files && input.files[0]) {
    var reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('uploaded-image').src = e.target.result;
      document.getElementById('uploaded-image').style.display = 'block';
    };
    reader.readAsDataURL(input.files[0]);
  }
}

router.use(verifyAddProductForm = (req, res, next) => {
  if(req.session.admin) {
    next()
  } else {
    res.redirect('/admin/login')
  }
})

function adminauth(req, res, next) {
  if (req.session && req.session.admin && req.session.adminloggedIn) {
      res.redirect("/admin/home")
  } else {
      next()
  }
}
function verify(req, res, next) {
  if (req.session && req.session.admin && req.session.adminloggedIn) {
      next();
  } else {
      res.redirect("/admin")
  }
}


module.exports = router;