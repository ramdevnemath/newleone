const User = require("../models/userSchema");
const Product = require("../models/productSchema");
const Category = require("../models/categorySchema");
const Address = require("../models/addressSchema");
const Cart = require("../models/cartSchema")
const Order = require('../models/orderSchema')
const bcrypt = require("bcrypt");
const nodemailer = require('nodemailer');
const { response } = require("../app");
const Admin = require("../models/adminSchema");
const mongoose = require("mongoose");
const otp = require("../config/otp");
const { json } = require("body-parser");
const { UserBindingContextImpl } = require("twilio/lib/rest/chat/v2/service/user/userBinding");
const ObjectId = mongoose.Types.ObjectId;

exports.isLogin = async (req, res, next) => {
  try {
    let user = req.session.user;
    if (user) {
      next();
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
  }
}

exports.indexPage = async (req, res) => {
  try {
    let user = req.session.user;
    const products = await Product.find({ deleted: false })
    const categories = await Category.find()
    console.log(products);
    res.render('users/index', { currentPage: 'home', products, user, categories })
  } catch (error) {
    console.log(error);
  }
}


exports.userSignup = async (req, res) => {
  res.render("users/user-signup", { other: true });
};


exports.homePage = async (req, res) => {
  try {
    let user = req.session.user;
    const products = await Product.find({ deleted: false })
    const categories = await Category.find()
    console.log(products);
    res.render('users/index', { currentPage: 'home', products, user, categories })
  } catch (error) {
    console.log(error);
  }
}

exports.loginPage = async (req, res) => {
  if (req.session && req.session.user && req.session.userlogged) {
    res.redirect("/");
  } else {
    res.render("users/user-login", {
      currentPage: 'home',
      other: true,
      loginErr: req.session.loginErr,
    });
    req.session.loginErr = false;
  }
}

exports.postSignup = async (req, res) => {
  try {
    const vUser = await User.findOne({
      $or: [{ email: req.body.email }, { mobile: req.body.mobile }],
    }).exec();

    if (!vUser) {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
        mobile: req.body.mobile,
        status: false,
        emailverified: false,
        mobileverification: true,
        isActive: true,
      })

      await User.create(newUser);
      req.session.errmsg = null;
      console.log(newUser);
      res.redirect("/login");
    } else {
      // User exists
      req.session.errmsg = "email or phone number already exists";
      console.log(error);
      res.redirect("/signup");
    }
  } catch (error) {
    console.log(error);
    res.redirect("/signup");
  }
},

  exports.postLogin = async (req, res) => {
    try {
      const newUser = await User.findOne({ email: req.body.email });
      console.log(newUser);
      if (newUser) {
        console.log("new user");
        bcrypt.compare(req.body.password, newUser.password).then((status) => {
          if (status) {
            if (newUser.isActive) {
              console.log("user exist");
              req.session.user = newUser;
              req.session.userloggedIn = true;
              console.log(newUser);
              res.redirect("/index");
            } else {
              req.session.loginErr = "User has been blocked";
              console.log("User has been blocked");
              res.status(400).redirect("/login");
            }
          }
        });
      } else {
        req.session.loginErr = "Invalid Email or Password";
        console.log("password is not matching");
        res.status(400).redirect("/login");
      }
    } catch (error) {
      console.log(error);
    }
  }

exports.logout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/");
  } catch (error) {
    console.log(error);
  }
}

exports.blockUser = async (req, res) => {
  await User.updateOne({ _id: req.params.id }, { isActive: false });
  req.flash("success", "User blocked successfully!");
  res.redirect("/admin/users");
}

exports.unBlockUser = async (req, res) => {
  await User.updateOne({ _id: req.params.id }, { isActive: true });
  req.flash("success", "User unblocked successfully!");
  res.redirect("/admin/users");
}

exports.deleteUser = async (req, res) => {
  try {
    await User.deleteOne({ _id: req.params.id });

    res.redirect("/admin/users",);
  } catch (error) {
    console.log(error);
  }
}

exports.userSingleProduct = async (req, res) => {
  try {
    let user = req.session.user;
    let id = req.params.id;
    let objId = new ObjectId(id);


    let singleProduct = await Product.findOne({ _id: objId }).populate('category');
    console.log(singleProduct)
    let categories = await Category.find({})




    res.render("users/single-product", {
      singleProduct,
      user
    }); //passing the singleProduct values while rendering the page...
  } catch (error) {
    console.log(error);
  }
}

exports.isLogin = async (req, res, next) => {
  try {
    let user = req.session.user;
    if (user) {
      next();
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
  }
}



exports.emailVerify = async (req, res, next) => {
  const response = {};
  try {
    const vUser = await User.findOne({
      $or: [{ email: req.body.email }, { mobile: req.body.mobile }],
    }).exec();

    if (vUser) {
      response.success = false;
      res.status(200).send({
        response,
        success: false,
        message: "User found",
      });
    } else {
      res.status(200).send({ success: true, message: "No user found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Error verifying user" });
  }
}

exports.sendOtp = async (req, res, next) => {
  try {
    const Otp = Math.floor(100000 + Math.random() * 871037);
    req.session.otP = Otp;
    console.log(req.session.otP);
    otp
      .OTP(req.body.mobile, req.session.otP)
      .then((response) => {
        response.success = true;
        res.status(200).send({
          response,
          success: true,
          message: "OTP Sent successfully",
        })
      })
      .catch((error) => {
        res
          .status(500)
          .send({ success: false, message: "Error sending OTP" });
      });
  } catch (error) {
    console.log(error);
  }
}

exports.verifyOtp = async (req, res, next) => {
  try {
    if (parseInt(req.body.userOtp) === req.session.otP) {
      res.status(200).send({
        success: true,
        response,
        message: "OTP verified successfully",
      });
    } else {
      req.session.errmsg = "Invalid Otp";
      res.status(500).send({ success: false, message: "Invalid Otp" });
    }
  } catch (error) {
    console.log(error);
  }
}



exports.otpLogin = async (req, res) => {
  try {
    const number = req.body.number;
    const actualNumber = "+91" + number;

    //generate random 6 digit number between 1-9
    let randomNumber = Math.floor(Math.random() * 908800) + 100000;

    //send random numbers to users number (twilio)
    client.messages
      .create({ body: randomNumber, from: "+910000000000", to: actualNumber })
      .then(otpfun());

    // save random Number to database then renders verify page
    async function otpfun() {
      const newUser = new OTP({
        users: req.body.number,
        otp: randomNumber,
      });
      await OTP.create(newUser);
    }
    res.render("users/verify", { other: true });

    function saveUser() {

      console.log(newUser)
      newUser
        .save()
        .then(() => {
          res.render("users/verify");
        })
        .catch((err) => {
          console.log("error generating number", err);
        });
    }
  } catch (error) {
    console.log(error);
  }
}

exports.deliveryAddress = async (req, res) => {
  let user = req.session.user;
  console.log(user, "id found");
  let userId = req.session.user._id;
  userId = userId.toString();

  const addressData = await Address.find({ user: userId });

  console.log(addressData);

  const address = addressData[0]?.address;
  console.log(address, "address found");
  console.log(userId, "user");

  try {
    ;
    cartItems = await Cart.aggregate([
      {
        $match: { userId },
      },
      {
        $unwind: "$products",
      },
      {
        $project: {
          item: { $toObjectId: "$products.item" },
          quantity: "$products.quantity",
          size: "$products.size",
          currentPrice: "$products.currentPrice",
          tax: "$products.tax",
          unique_id: "$products._id",
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "item",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      {
        $project: {
          unique_id: 1,
          item: 1,
          quantity: 1,
          size: 1,
          currentPrice: 1,
          tax: 1,
          productInfo: { $arrayElemAt: ["$productInfo", 0] },
        },
      },
    ]);
    console.log(cartItems);

    let total = await Cart.aggregate([
      {
        $match: { user: req.session.userId },
      },
      {
        $unwind: "$products",
      },
      {
        $project: {
          item: { $toObjectId: "$products.item" },
          size: "$products.size",
          currentPrice: "$products.currentPrice",
          tax: "$products.tax",
          quantity: "$products.quantity",
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "item",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      {
        $project: {
          item: 1,
          size: 1,
          currentPrice: 1,
          tax: 1,
          quantity: 1,
          productInfo: { $arrayElemAt: ["$productInfo", 0] },
        },
      },
      {
        $group: {
          _id: null,

          totalTax: { $sum: { $multiply: ["$quantity", "$tax"] } },
          total: { $sum: { $multiply: ["$quantity", "$currentPrice"] } },
          totalWithTax: {
            $sum: {
              $multiply: ["$quantity", { $add: ["$tax", "$currentPrice"] }],
            },
          },
        },
      },
    ])

    console.log(total, "cart got");
    res.render("users/address", {
      cartIcon: true,
      user,
      total,
      address,
      cartItems,
    });
  } catch (error) {
    console.log(error);
  }
};


exports.deliveryAddressPost = async (req, res) => {
  let orders = req.body;
  console.log(orders);
  let cod = req.body["payment-method"];
  console.log(cod);

  let addressId = new mongoose.Types.ObjectId(req.body.address);

  console.log(addressId);

  try {
    const addressDetails = await Address.findOne(
      { "address._id": addressId },
      { "address.$": 1 }
    );
    console.log(addressDetails);

    let filteredAddress = addressDetails.address[0];
    console.log(filteredAddress);
    console.log(filteredAddress.firstname);

    let cart = await Cart.findOne({ userId: req.session.user._id });
    let userId = req.session.user._id;
    console.log(cart, userId);

    let total = await Cart.aggregate([
      {
        $match: { user: req.session.userId },
      },
      {
        $unwind: "$products",
      },
      {
        $project: {
          item: { $toObjectId: "$products.item" },
          size: "$products.size",
          currentPrice: "$products.currentPrice",
          tax: "$products.tax",
          quantity: "$products.quantity",
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "item",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      {
        $project: {
          item: 1,
          size: 1,
          currentPrice: 1,
          tax: 1,
          quantity: 1,
          productInfo: { $arrayElemAt: ["$productInfo", 0] },
        },
      },
      {
        $group: {
          _id: null,

          totalTax: { $sum: { $multiply: ["$quantity", "$tax"] } },
          total: { $sum: { $multiply: ["$quantity", "$currentPrice"] } },
          totalWithTax: {
            $sum: {
              $multiply: ["$quantity", { $add: ["$tax", "$currentPrice"] }],
            },
          },
        },
      },
    ])

    console.log(cart.products)

    console.log(total[0].totalWithTax, "cart got")
    let status = req.body["payment-method"] === "COD" ? "placed" : "pending";

    let orderObj = new Order({
      deliveryDetails: {
        firstname: filteredAddress.firstname,
        lastname: filteredAddress.lastname,
        state: filteredAddress.state,
        streetaddress: filteredAddress.streetaddress,
        appartment: filteredAddress.appartment,
        town: filteredAddress.town,
        zip: filteredAddress.zip,
        mobile: filteredAddress.mobile,
        email: filteredAddress.email,
        radio: filteredAddress.radio,
      },
      userId: cart.userId,
      paymentMethod: req.body["payment-method"],
      products: cart.products,
      totalAmount: total[0].totalWithTax,
      paymentstatus: status,
      deliverystatus: "not shipped",
      createdAt: new Date(),
    });
    console.log(orderObj);
    let orderDoc = await Order.create(orderObj);
    console.log(orderDoc, "order createad");
    let orderId = orderDoc._id;
    let orderIdString = orderId.toString();
    console.log(orderIdString, "order string");
    // Find and delete the cart items for the user
    await Cart.findOneAndDelete({ userId: cart.userId });
    if (req.body["payment-method"] == "COD")
      res.json({ codSuccess: true });
  } catch (error) {
    console.log(error);
  }
}

exports.savedAddressPost = async (req, res) => {
  let user = req.session.user._id;
  console.log(user, "user found");
  console.log(req.body);
  let addaddress = {
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    state: req.body.state,
    streetaddress: req.body.address,
    appartment: req.body.appartment,
    town: req.body.town,
    zip: req.body.postcode,
    mobile: req.body.mobile,
    email: req.body.email,
    radio: req.body.optradio,
  }
  try {
    const data = await Address.findOne({ user: user });
    if (data) {
      data.address.push(addaddress);
      const updated_data = await Address.findOneAndUpdate(
        { user: user },
        { $set: { address: data.address } },
        { returnDocument: "after" }
      );
      console.log(updated_data, "updated address collection");
    } else {
      const address = new Address({
        user: req.session.user._id,
        address: [addaddress],
      });
      const address_data = await address.save();
      console.log(address_data, "address collection");
    }

    res.json(true);
  } catch (error) {
    console.log(error);
  }
}

exports.savedAddressget = async (req, res) => {
  let user = req.session.user;
  let userId = req.session.user._id;
  userId = userId.toString();
  console.log(user, "user here");

  const cartCount = req.cartCount;
  const addressData = await Address.find({ user: user._id });

  if (addressData && addressData.length > 0) {
    const address = addressData[0].address;
    console.log(address, "address got");

    try {
      res.render("users/savedAddress", {
        user,
        cartCount,
        address,
      });
    } catch (error) {
      console.log(error);
    }
    json(true);
  } else {
    console.log("No address data found");
    res.render("users/savedAddress", {
      user,
      cartCount,
      address: [],
    });
  }
  // Clear any existing session data for address
  req.session.address = null;
}

exports.editSavedAddress = async (req, res) => {
  try {
    let user = req.session.user;
    // Access cartCount value from req object
    const cartCount = req.cartCount;
    console.log(req.params.id); // Check if id is coming in params
    const address = await Address.findOne({ "address._id": req.params.id });
    const selectedAddress = address.address.find(
      (addr) => addr._id.toString() === req.params.id
    );
    console.log(selectedAddress, "selectedAddress");
    res.render("users/editSavedAddress", {
      user,
      cartCount,
      address: selectedAddress,
    })
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
}

exports.editSavedAddressPost = async (req, res) => {

  try {
    const userId = req.session.user._id;
    const addressId = req.params.id;

    console.log(userId);
    console.log(addressId);

    const user = await Address.findOne({ user: userId });

    const address = user.address.find((a) => a._id.toString() === addressId);
    console.log(address, "address got");

    const updatedAddress = {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      state: req.body.state,
      streetaddress: req.body.address,
      appartment: req.body.appartment,
      town: req.body.town,
      zip: req.body.postcode,
      mobile: req.body.mobile,
      email: req.body.email,
      radio: req.body.optradio,
    };

    const result = await Address.updateOne(
      { user: userId, "address._id": new ObjectId(addressId) },
      { $set: { "address.$": updatedAddress } }
    );

    console.log(result);
    res.redirect("/savedAddress");
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
}

exports.deleteAddress = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const addressId = req.params.id;

    const result = await Address.updateOne(
      { user: userId },
      { $pull: { address: { _id: new ObjectId(addressId) } } }
    );

    console.log(result);
    res.sendStatus(204);
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
}

exports.getProfile = async (req, res) => {
  try {
    let user = req.session.user;

    if (user && user._id) {
      var userDetails = await User.findOne({ _id: user._id });
      console.log(userDetails);
    } else {
      console.log('User not found');
      return res.redirect('/login');
    }

    const products = await Product.find();
    const categories = await Category.find();
    res.render('users/profile', {
       products, 
       user, 
       categories, 
       name: userDetails.name,
       email: userDetails.email,
       mobile: userDetails.mobile 
      });
  } catch (error) {
    console.log(error);
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    res.render('users/forgotPass', { other: true })
  } catch (error) {
    console.log(error)
  }
}