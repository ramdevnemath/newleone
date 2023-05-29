const Product = require('../models/productSchema')
const Category = require('../models/categorySchema')

const multer = require('multer')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/admin/uploads');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage })


exports.addProductPage = async (req, res) => {
    let adminDetails = req.session.admin;
    const products = await Product.find({});
    const categories = await Category.find();
    // const categories = await Category.find();
    // console.log(categories, 'categories')
    res.render('admin/add-product', { admin: true, adminDetails, categories, products })
}


exports.postProduct = async (req, res, next) => {
    console.log(req.body)
    console.log(req.files)
    // console.log(req.body.category)
    try {
        const newProduct = new Product({
            company: req.body.company,
            productName: req.body.productName,
            description: req.body.description,
            type: req.body.type,
            category: req.body.category,
            // subcategory: req.body.subcategory,
            // deal: req.body.deal,
            price: req.body.price,
            stock: req.body.stock,
            image: req.files.map(file => file.filename)
        });
        await Product.create(newProduct);
        console.log(newProduct)
        res.redirect('/admin/home');
    } catch (error) {
        console.log(error);
    }
}

exports.getAllProducts = async (req, res) => {
    try {
      const products = await Product.find({});
  
      const categories = await Category.find();
  
      const populatedProducts = await Promise.all(products.map(async (product) => {
        const category = categories.find((cat) => cat.id.toString() === product.category.toString());
        const categoryName = category ? category.category : 'Category not found';
  
        return {
          ...product.toObject(),
          categoryName
        };
      }));
  
      console.log(populatedProducts);
  
      let adminDetails = req.session.admin;
  
      console.log(categories);
      console.log(req.session.notification);
  
      res.render('admin/view-products', { admin: true, products: populatedProducts, adminDetails, categories, msg: req.session.notification });
      req.session.notification = '';
      req.session.save();
    } catch (error) {
      console.log(error);
    }
  };
  

exports.deleteProduct = async (req, res) => {
    console.log(req.params.id)
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { deleted: true },
            { new: true }
        )
        if (!product) {
            return res.status(404).json({ message: 'Product not found' })
        }
        res.redirect('back')
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Server error' })
    }
}

exports.deleteCategory = async (req, res) => {
    console.log(req.params.id)
    try {
        const categories = await Category.findByIdAndUpdate(
            req.params.id,
            { delete: true },
            { new: true }
        )
        if (!categories) {
            return res.status(404).json({ message: 'Category not found' })
        }
        res.redirect('back')
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Server error' })
    }
}

exports.getEditProductPage = async (req, res) => {
    try {
      const editProduct = await Product.findOne({ _id: req.params.id });
      console.log(editProduct, "editProduct found");
  
      let adminDetails = req.session.admin;
      const categories = await Category.find();
      console.log(categories);
  
      const category = await Category.findOne({ _id: editProduct.category });
  
      res.render('admin/edit-product', { editProduct, admin: true, adminDetails, category, categories });
    } catch (error) {
      console.log(error);
    }
  };
  
  

exports.editProduct = async (req, res) => {
    try {
      const existingProduct = await Product.findOne({ _id: req.params.id });
      const existingImages = existingProduct.image;
      
  
      upload.array('image', 3)(req, res, async (err) => {
        try {
          let updatedImages = existingImages; // Initialize with existing image filenames
  
          if (req.files && req.files.length > 0) {
            updatedImages = req.files.map(file => file.filename); // Update with new image filenames
          }
  
          const items = await Product.updateOne(
            { _id: req.params.id },
            {
              company: req.body.company,
              productName: req.body.productName,
              type: req.body.type,
              category: req.body.category,
              // subcategory: req.body.subcategory,
              stock: req.body.stock,
              price: req.body.price,
              size: req.body.size,
              image: updatedImages
            }
          );
  
          console.log(items);
          req.session.notification = 'product edited'
           res.redirect('/admin/products');
          console.log('Redirected');
        } catch (error) {
          console.log(error);
        }
      });
    } catch (error) {
      console.log(error);
    }
  };
  

exports.editCategory = async (req, res) => {
    try {
        const editCategory = await Category.findOne({ _id: req.params.id })
        console.log(editCategory, "editCategory found")
        let adminDetails = req.session.admin;
        // const subcategories = await SubCategory.find()

        res.render('admin/edit-category', { editCategory, admin: true, adminDetails })
    } catch (error) {
        console.log(error);
    }
}

exports.postEditCategory = async (req, res) => {
    console.log(req.params.id, 'params')
    console.log('trueeee');
    console.log(req.body, 'body')
    try {
        const items = await Category.updateOne({ _id: req.params.id }, {
            category: req.body.category,
        })

        console.log(items)
        await res.redirect('/admin/products');
        console.log('redirected')
    } catch (error) {
        console.log(error)
    }
}