const User = require("../models/userSchema");
const Product = require("../models/productSchema");
const Category = require("../models/categorySchema");
const Address = require("../models/addressSchema");
const Cart = require("../models/cartSchema")
const Order = require('../models/orderSchema')
const Wallet = require("../models/walletSchema");
const Offer = require("../models/offerSchema")
const bcrypt = require("bcrypt");
const nodemailer = require('nodemailer');
const { response } = require("../app");
const Admin = require("../models/adminSchema");
const mongoose = require("mongoose");
const otp = require("../config/otp");
const { json } = require("body-parser");
const { UserBindingContextImpl } = require("twilio/lib/rest/chat/v2/service/user/userBinding");
const ObjectId = mongoose.Types.ObjectId;
const Razorpay = require('razorpay')

//creation of instance for razorpay
var instance = new Razorpay({
  key_id: process.env.key_id,
  key_secret: process.env.key_secret,
});

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
    res.render('users/index', { currentPage: 'home', footer: true, products, user, categories })
  } catch (error) {
    console.log(error);
  }
}


exports.userSignup = async (req, res) => {
  res.render("users/user-signup", { other: true, footer: false });
};


exports.homePage = async (req, res) => {
  try {
    let user = req.session.user;
    const products = await Product.find({ deleted: false })
    const categories = await Category.find()
    const offer = await Offer.find()
    res.render('users/index', { currentPage: 'home', footer: true, products, user, categories })
  } catch (error) {
    console.log(error);
  }
}

exports.loginPage = async (req, res) => {
  if (req.session && req.session.user && req.session.userlogged) {
    res.redirect("/");
  } else {
    res.render("users/user-login", {
      footer: false,
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
      if (newUser) {
        console.log("new user");
        bcrypt.compare(req.body.password, newUser.password).then((status) => {
          if (status) {
            if (newUser.isActive) {
              console.log("user exist");
              req.session.user = newUser;
              req.session.userloggedIn = true;
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
    console.log(singleProduct,'single product');
    let proid = new ObjectId(singleProduct.category);
    const categoryInfo = await Category.aggregate([
      {
        $match: {
          _id: proid,
        },
      },
    ]);
    let categoryName = categoryInfo[0].category;
    const offer = await Offer.find({ category: categoryName });
    if(offer.length > 0) {
      var discountedPrice = Math.floor(singleProduct.price - (singleProduct.price * offer[0].discount / 100))
    } else {
      var discountedPrice = 0;
    }
    

    res.render("users/single-product", {
      footer: true,
      singleProduct,
      user,
      offer,
      discountedPrice,
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
    res.render("users/verify", { other: true, footer: true });

    function saveUser() {
      newUser
        .save()
        .then(() => {
          res.render("users/verify", { footer: true });
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
  let userId = req.session.user._id;
  userId = userId.toString();

  const addressData = await Address.find({ user: user._id });
  const address = addressData[0].address;

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

    let total = await Cart.aggregate([
      {
        $match: { userId: req.session.user._id },
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
          quantity: 1,
          size: 1,
          currentPrice: 1,
          tax: 1,
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
          // total: { $sum: { $multiply: ["$quantity", "$productInfo.price"] } },
        },
      },
    ]);

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
  let cod = req.body["payment-method"];
  let myCoupon = req.body.couponAmount;
  myCoupon = myCoupon.replace("₹", "");
  let addressId = new mongoose.Types.ObjectId(req.body.address);

  try {
    const addressDetails = await Address.findOne(
      { "address._id": addressId },
      { "address.$": 1 }
    );

    let filteredAddress = addressDetails.address[0];

    let cart = await Cart.findOne({ userId: req.session.user._id });
    let userId = req.session.user._id;

    let total = await Cart.aggregate([
      {
        $match: { userId: req.session.user._id },
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
    ]);
    
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
    let orderDoc = await Order.create(orderObj);
    let orderId = orderDoc._id;
    let orderIdString = orderId.toString();
    // Find and delete the cart items for the user
    await Cart.findOneAndDelete({ userId: cart.userId });
    let walletItems = await Wallet.findOne({ userId: req.session.user._id });
    let balance;

    if (walletItems) {
      balance = walletItems.balance;
    } else {
      const newWallet = new Wallet({
        userId: req.session.user._id,
        balance: 0, // Set the initial balance to 0 or any other desired value
      });
      const savedWallet = await newWallet.save();
      balance = savedWallet.balance;
    }

    if (req.body["payment-method"] == "COD") {
      res.json({ codSuccess: true });


    } else if (req.body["payment-method"] == "RazorPay") {
      if (myCoupon) {
        var options = {
          amount: (orderDoc.totalAmount - myCoupon) * 100, // amount in the smallest currency unit
          currency: "INR",
          receipt: orderIdString,
        };
      } else {
        var options = {
          amount: orderDoc.totalAmount * 100, // amount in the smallest currency unit
          currency: "INR",
          receipt: orderIdString,
        };
      }

      instance.orders.create(options, function (err, order) {
        res.json(order);
      });



    } else if (req.body["payment-method"] == "Wallet") {
      if (total[0].totalWithTax <= balance) {
        // Check if wallet balance is sufficient for the purchase
        // Deduct the purchase amount from the wallet balance
        balance -= total[0].totalWithTax;
        walletItems.balance = balance;
        await walletItems.save();

        console.log("Order placed using wallet payment");
        res.json({ codSuccess: true });
      } else if (total[0].total > balance) {
        console.log("Insufficient funds in wallet");
        res.json({ emptyWallet: true });
      }
    }
  } catch (error) {
    console.log(error);
  }
};

exports.savedAddressPost = async (req, res) => {
  let user = req.session.user._id;
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
    } else {
      const address = new Address({
        user: req.session.user._id,
        address: [addaddress],
      });
      const address_data = await address.save();
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

  const cartCount = req.cartCount;
  const addressData = await Address.find({ user: user._id });

  if (addressData && addressData.length > 0) {
    const address = addressData[0].address;

    try {
      res.render("users/savedAddress", {
        footer: true,
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
      footer: true,
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
    res.render("users/editSavedAddress", {
      footer: true,
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

    const user = await Address.findOne({ user: userId });

    const address = user.address.find((a) => a._id.toString() === addressId);

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
    } else {
      console.log('User not found');
      return res.redirect('/login');
    }

    const products = await Product.find();
    const categories = await Category.find();
    res.render('users/profile', {
      footer: true,
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
    res.render('users/forgotPass', { other: true, footer: true })
  } catch (error) {
    console.log(error)
  }
}

exports.paymentVerify = async (req, res) => {
  try {

    let details = req.body;

    const crypto = require("crypto");
    let hmac = crypto.createHmac("sha256", "F5CeQyznxe5ZoGru8KA6q8OS");
    hmac.update(
      details["payment[razorpay_order_id]"] +
      "|" +
      details["payment[razorpay_payment_id]"]
    );
    hmac = hmac.digest("hex");

    let orderResponse = details["order[receipt]"];
    let orderObjId = new ObjectId(orderResponse);

    if (hmac === details["payment[razorpay_signature]"]) {

      let transactionId = String(details["payment[razorpay_payment_id]"]);
      console.log(transactionId,"transactionId")

      let order = await Order.updateOne(
        { _id: orderObjId },
        {
          $set: {
            paymentstatus: "placed"
          },
        }
      );

      res.json({ status: true });
    } else {
      await Order.updateOne(
        { _id: orderObjId },
        {
          $set: {
            paymentstatus: "failed",
          },
        }
      );
      console.log("Payment is failed");
      res.json({ status: false, errMsg: "" });
    }
  } catch (error) {
    console.log(error, "error");
    res.status(500).send("Internal server error");
  }
};

exports.paymentFailed = async (req, res) => {
  res.render("users/paymentFailed", { other: true, footer: true });
};

exports.userProfile = async (req, res) => {
  const userId = req.session.user._id;
  let userDetails = await User.findOne({ _id: req.session.user._id });
  let walletItems = await Wallet.findOne({ userId });

  if (!walletItems) {
    walletItems = new Wallet({
      userId,
      balance: 0,
    });
  }
  const balance = walletItems.balance;

  let user = req.session.user;
  const addressData = await Address.find({ user: user._id });

  // Access cartCount value from req object
  const cartCount = req.cartCount;
  const address = addressData[0].address;
  if (addressData.length > 0 && addressData) {

    res.render("users/userprofile", {
      address,
      userDetails,
      user,
      cartCount,
      balance,
    });
  } else {
    res.redirect('/address')
  }
};

exports.editUserProfile = async (req, res) => {
  console.log(req.body, "user");
  const userProfile = await User.findOneAndUpdate(
    { _id: req.params.id }, // filter object
    { name: req.body.name, email: req.body.email, mobile: req.body.phone } // update object
  );
  res.redirect("/profile");
};

exports.addressEdit = (req, res) => {
  const { addressId, ...formData } = req.body;
  try {
  } catch (error) { }
};

exports.confirmAndUpdatePassword = async (req, res) => {
  let verifiedUser = await User.findOne({ _id: req.session.user._id });

  bcrypt
    .compare(req.body.currentpassword, verifiedUser.password)
    .then(async (status) => {
      if (status) {
        let hashPassword = await bcrypt.hash(req.body.newpassword, 10);

        await User.findOneAndUpdate(
          { _id: req.session.user._id }, // filter object
          { password: hashPassword } // update object
        );
        res.json(true);
      } else {
        console.log("password is not matching");

        res.json({ message: "not matching" });
      }
    });
};

exports.search = async (req, res) => {
  try {
    const query = req.query.q || '';
    if (query.length < 2) {
      res.json({ suggestions: [] });
      return;
    }

    // Perform the search using the query parameter
    const suggestions = await Product.find({ name: { $regex: query, $options: 'i' } }).limit(10);

    // Return a JSON response with the search suggestions
    res.json({ suggestions: suggestions.map((product) => product.name) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while retrieving search suggestions.' });
  }
};

exports.searching = async (req, res) => {
  try {
    // Get the search query from the request
    const query = req.query.query;

    // Perform the search operation (e.g., querying a database)
    const searchProducts = await Product.find({ name: query });
    console.log(searchProducts, "done");
    // Return the results as JSON
    res.json(searchProducts);
    console.log("sended");
  } catch (error) {
    // Handle any errors that occurred during the search
    console.error(error);
    res.status(500).json({ error: 'An error occurred during the search.' });
  }
};

exports.mensPage = async (req, res) => {
  try {
    const category = await Category.findOne({ category: "Men's" });
    // const catId = category._id;
    console.log(category,"cat")
    const products = await Product.find({ category: category }) // Convert the query result to plain JavaScript objects
    console.log(products,"products")
    // Get the filter parameters from the request
    const { price, company, type } = req.query;

    // Apply filters if any
    let filteredProducts = products;

    if (price) {
      filteredProducts = filteredProducts.filter(product => product.price >= parseInt(price));
    }
    if (company) {
      filteredProducts = filteredProducts.filter(product => product.company === company);
    }
    if (type) {
      filteredProducts = filteredProducts.filter(product => product.type === type);
    }

    res.render('users/men', { products: filteredProducts });
  } catch (error) {
    console.error(error);
  }
};

exports.womensPage = async (req, res) => {
  try {
    const category = await Category.findOne({category: "Women's"})
    const catId = category._id
    const products = await Product.find({category: catId})
    res.render('users/women', {products})
  } catch (error) {
    console.error(error)
  }
}

exports.kidsPage = async (req, res) => {
  try {
    const category = await Category.findOne({category: "Kid's"})
    const catId = category._id
    const products = await Product.find({category: catId})
    res.render('users/kid', {products})
  } catch (error) {
    console.error(error)
  }
}

exports.filterProducts = async (req, res) => {
  try {
    
    const { price, company, types, category } = req.body;
    console.log(req.body,"💕💕💕")
    // Build the filter object based on the provided criteria
    const filter = {};

    // Apply the price filter

    if (price !== 'any') {
      const [minPrice, maxPrice] = price.split(' - ');
      filter.price = { $gte: parseInt(minPrice), $lte: parseInt(maxPrice) };
    }

    // Apply the company filter
    if (company.length > 0) {
      filter.company = { $in: company };
    }

    // Apply the type filter
    if (types.length > 0) {
      filter.type = { $in: types };
    }

    console.log(filter,"❤️❤️");

    // Retrieve the filtered products from the database
    const cat = await Category.findOne({ category: category });
    const catId = cat._id
    const filteredProducts = await Product.find({ category: catId, ...filter });


    console.log(filteredProducts);

    // Send the filtered products as the response
    res.json(filteredProducts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
