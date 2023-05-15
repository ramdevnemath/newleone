const User = require("../models/userSchema");
const Product = require("../models/productSchema");
const Category = require("../models/categorySchema");
const bcrypt = require("bcrypt");
const { response } = require("../app");
const Admin = require("../models/adminSchema");
const mongoose = require("mongoose");
const otp = require("../config/otp");

/////
const { json } = require("body-parser");
const { UserBindingContextImpl } = require("twilio/lib/rest/chat/v2/service/user/userBinding");
/////
const ObjectId = mongoose.Types.ObjectId;

/////

exports.indexPage = async (req, res) => {
  try {
    let user = req.session.user;
    const products = await Product.find({ deleted:false })
    const categories = await Category.find()
    console.log(products);
    res.render('users/index', { currentPage: 'home', products, user, categories})
  } catch (error) {
    console.log(error);
  }
  // if(user) {
  //   res.render("users/index", { user });
  // } else {
  //   res.redirect('/')
  // }
}



exports.userSignup = async (req, res) => {
  res.render("users/user-signup", { other: true });
};


exports.homePage = async (req, res) => {
  try {
    let user = req.session.user;
    const products = await Product.find({ deleted:false})
    const categories = await Category.find()
    console.log(products);
    res.render('users/index', { currentPage: 'home', products, user, categories})
  } catch (error) {
    console.log(error);
  }
  // if(user) {
  //   res.render("users/index", { user });
  // } else {
  //   res.redirect('/')
  // }
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
};

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
      });

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
};

exports.logout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/");
  } catch (error) {
    console.log(error);
  }
};

exports.userslist = async (req, res) => {
  try {
    let adminDetails = req.session.admin;
    const userList = await User.find({});
    res.render("admin/usersList", { userList, admin: true, adminDetails });
  } catch (error) {
    console.log(error);
  }
};

exports.blockUser = async (req, res) => {
  await User.updateOne({ _id: req.params.id }, { isActive: false });
  req.flash("success", "User blocked successfully!");
  res.redirect("/admin/accounts");
};
exports.unBlockUser = async (req, res) => {
  await User.updateOne({ _id: req.params.id }, { isActive: true });
  req.flash("success", "User unblocked successfully!");
  res.redirect("/admin/accounts");
};

exports.deleteUser = async (req, res) => {
  try {
    await User.deleteOne({ _id: req.params.id });

    res.redirect("/admin/accounts");
  } catch (error) {
    console.log(error);
  }
};

exports.userSingleProduct = async (req, res) => {
  try {
    let id = req.params.id;
    let objId = new ObjectId(id);
    

    let singleProduct = await Product.findOne({ _id: objId }).populate('category');
    console.log(singleProduct)
    let categories = await Category.find({})
    
    let user = req.session.user;


    res.render("users/single-product", {
      singleProduct,
      user
    }); //passing the singleProduct values while rendering the page...
  } catch (error) {
    console.log(error);
  }
};

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
};



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
        });
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
          res.render("user/verify");
        })
        .catch((err) => {
          console.log("error generating number", err);
        });
    }
  } catch (error) {
    console.log(error);
  }
};