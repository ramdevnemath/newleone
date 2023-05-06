var express = require('express')
var router = express.Router()
const productController = require('../controllers/productControllers')
const adminController = require('../controllers/adminControllers')
const userController = require('../controllers/userControllers')
const multer = require('multer')
// const subCategoryController = require('../controllers/subCategoryControllers')
const storage = multer.diskStorage({
  destination: function (req, files, cb) {
    cb(null, './public/admin/uploads/') // specify the folder where the uploaded files will be stored
  },
  filename: function (req, files, cb) {
    cb(null, Date.now() + 'Leone' + files.originalname) // specify the filename of the uploaded files
  }
});

const upload = multer({ storage: storage });

router.get('/', adminController.adminLogin)
router.get('/login', adminController.adminLogin)
router.post('/postLogin', adminController.postAdminLogin)
router.get('/products', productController.getAllProducts)
router.get('/logout', adminController.logout)
router.get('/add-product', productController.addProductPage)
router.post('/add-product', upload.array('image',3), productController.postProduct)
// router.delete('/deleteProduct/:id', productController.deleteProduct)
// router.get('/editProduct/:id', productController.getEditProductPage)
// router.post('/editProduct/:id', productController.editProduct)
router.get('/home', adminController.getDashboard)
router.post('/home', adminController.getDashboard)
router.get('/userList', userController.userslist)
router.get('/block/:id', userController.blockUser)
router.get('/unblock/:id', userController.unBlockUser)
router.delete('/delete/:id', userController.deleteUser)
router.get('/addCategory', adminController.addCategory)
router.post('/addCategory', adminController.addCategoryPost)
// router.get('/addSubCategory', subCategoryController.createSubCategory)
// router.post('/addSubCategory', subCategoryController.createSubCategoryPost)
router.get('/orders', adminController.Orders)

router.use(verifyAdminLogin = (req, res, next) => {
  if(req.session.admin) {
    next()
  } else {
    res.redirect('/admin/login')
  }
})

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






module.exports = router;