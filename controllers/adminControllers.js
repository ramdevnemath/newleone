const Admin = require("../models/adminSchema");
const Category = require("../models/categorySchema");
const multer = require("multer");
const bcrypt = require("bcrypt");
const mongoose = require('mongoose')

exports.getDashboard = async (req, res) => {
  let adminDetails = req.session.admin;
  res.render("admin/adminHome", { admin: true, adminDetails });
};

exports.adminLogin = async (req, res) => {
  if (req.session.admin) {
    res.redirect("/admin/home");
  } else {
    const adminErr = req.session.adminErr;
    req.session.adminErr = false;
    res.render("admin/adminLogin", { other: true, login: adminErr });
  }
};

exports.postAdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin) {
      // No admin user found with this email address
      console.log("Invalid email or password");
      req.session.adminErr = "Invalid email or password";
      return res.redirect("/admin/login");
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      // Password is incorrect
      console.log("Invalid email or password");
      req.session.adminErr = "Invalid email or password";
      return res.redirect("/admin/login");
    }

    // Authentication successful - create session
    req.session.admin = admin;
    req.session.admin.loggedIn = true;
    res.redirect("/admin/home");

  } catch (error) {
    console.log(error);
    req.session.adminErr = "Something went wrong";
    res.redirect("/admin/login");
  }
};


exports.logout = async (req, res) => {
  req.session.admin = null;
  res.redirect("/admin/login");
};

exports.addCategory = async (req, res) => {
  if (req.session.admin) {
    const category_data = await Category.find();

    res.render("admin/addCategory", { category: category_data, admin: true });
  } else {
    res.redirect("admin/login");
  }
};

exports.addCategoryPost = async (req, res) => {
  try {
    const category_data = await Category.find();
    if (category_data.length > 0) {
      let checking = false;
      for (let i = 0; i < category_data.length; i++) {
        if (
          category_data[i]["category"].toLowerCase() === req.body.category.toLowerCase()
        ) {
          checking = true;
          break;
        }
      }
      if (checking == false) {
        let category = new Category({
          category: req.body.category,
          description: req.body.description,
        });

        const cart_data = await category.save();
        res.redirect("addCategory");
        console.log("new category added");
        // res.send('Category added successfully');
      } else {
        res.redirect("addCategory");
        console.log("category already exists");
        // res.status(200).send({success:true, msg: "This category ("+req.body.category+")is already exists."})
      }
    } else {
      const category = new Category({
        category: req.body.category,
        description: req.body.description,
      });
      await category.save();
      console.log("newcategory");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.Orders = async (req, res) => {
  let userId = req.session.user;
  try {
    // let orders =await Order.findOne({})
    let orders = await Order.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "products.item",
          foreignField: "_id",
          as: "productInfo",
        },
      },
    ]);

    // Now each object in the `products` array of each order will contain the product details
    // in addition to the item id and quantity.

    console.log(orders);
   

    res.render("admin/orderList", { admin: true, orders });
  } catch (error) {
    console.log(error);
  }
};