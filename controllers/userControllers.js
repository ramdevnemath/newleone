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
  let user = req.session.user;
  if(user) {
    res.render("users/index", { user });
  } else {
    res.redirect('/')
  }
}



exports.userSignup = async (req, res) => {
  res.render("users/user-signup", { other: true });
};

exports.userHome = async (req, res) => {
  try {
    res.render("users/index", { other: true });
  } catch (error) {
    console.log(error);
  }
};

exports.homePage = async (req, res) => {
  try {
    res.render("users/index", {});
  } catch (error) {
    console.log(error);
  }
};

exports.loginPage = async (req, res) => {
  if (req.session && req.session.user && req.session.userlogged) {
    res.redirect("/");
  } else {
    res.render("users/user-login", {
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
            req.session.user.loggedIn = true;
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
  res.redirect("/admin/usersList");
};
exports.unBlockUser = async (req, res) => {
  await User.updateOne({ _id: req.params.id }, { isActive: true });
  req.flash("success", "User unblocked successfully!");
  res.redirect("/admin/usersList");
};

exports.deleteUser = async (req, res) => {
  try {
    await User.deleteOne({ _id: req.params.id });

    res.redirect("/admin/usersList");
  } catch (error) {
    console.log(error);
  }
};

exports.userSingleProduct = async (req, res) => {
  try {
    let id = req.params.id;
    let objId = new ObjectId(id);

    let singleProduct = await Product.findOne({ _id: objId });
    let user = req.session.user;

    // Access cartCount value from req object
    const cartCount = req.cartCount;

    res.render("users/single-product", {
      singleProduct,
      user,
      video: true,
      cartCount,
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



// exports.otpLogin = async (req, res) => {
//   try {
//     const number = req.body.number;
//     const actualNumber = "+91" + number;

//     //generate random 6 digit number between 1-9
//     let randomNumber = Math.floor(Math.random() * 908800) + 100000;

//     //send random numbers to users number (twilio)
//     client.messages
//       .create({ body: randomNumber, from: "+910000000000", to: actualNumber })
//       .then(otpfun());

    //save random Number to database then renders verify page
    // async function otpfun() {
    //   const newUser = new OTP({
    //     users: req.body.number,
    //     otp: randomNumber,
    //   });
    //   await OTP.create(newUser);
    // }
    // res.render("users/verify", { other: true });

    // function saveUser() {

    //   console.log(newUser)
    //   newUser
    //     .save()
    //     .then(() => {
    //       res.render("user/verify");
    //     })
    //     .catch((err) => {
    //       console.log("error generating number", err);
    //     });
    // }
//   } catch (error) {
//     console.log(error);
//   }
// };

// exports.verify = async (req, res) => {
//   res.render("users/verify", { other: true });
// };
// exports.postVerify = (req, res) => {
//   const code = req.body.code;
//   console.log(req.body.code);
//   console.log("clicked verify");
//   OTP.findOne({ users: code }, (err, found) => {
//     if (err) {
//       res.render("error");
//     } else if (found) {
//       res.render("user/success");
//     } else {
//       res.render("user/error");
//     }

//   OTP.findOne({ otp: code }).then((found) => {
//     if (found) {
//       console.log("success");
//       res.render("users/success", { other: true });
//     } else {
//       console.log("error");
//       res.render("users/error", { other: true });
//     }
//   });
//   console.log("jksadhfkjhkjsadfhkjhsadkjf");

//   OTP.findOneAndDelete({ otp: code })
//     .exec()
//     .then((result) => {
//       console.log("deleted");
//     })
//     .catch((err) => {
//       console.log(err);
//     });
// };

//   OTP.findOneAndDelete({ users: code }, (err) => {
//     if (err) {
//       console.log(err);
//     } else {
//       console.log("deleted");
//     }
//   });
// }

// exports.otpSuccess = (req, res) => {
//   res.render("user/success", { other: true });
// };
// exports.otpError = (req, res) => {
//   res.render("user/error", { other: true });
// };

//admin side user controller
//admin side user management below


// exports.deliveryAddress = async (req, res) => {
//   let user = req.session.user;
//   console.log(user, "id found");
//   let userId = req.session.user._id;
//   userId = userId.toString();

//   const addressData = await Address.find({ user: user._id });
//   console.log(addressData);
//   const address = addressData[0].address;
//   console.log(address, "address found");

//   console.log(userId, "user");

//   try {
//     let total = await Cart.aggregate([
//       {
//         $match: { userId },
//       },
//       {
//         $unwind: "$products",
//       },
//       {
//         $project: {
//           item: { $toObjectId: "$products.item" },
//           quantity: "$products.quantity",
//         },
//       },
//       {
//         $lookup: {
//           from: "products",
//           localField: "item",
//           foreignField: "_id",
//           as: "productInfo",
//         },
//       },
//       {
//         $project: {
//           item: 1,
//           quantity: 1,
//           productInfo: { $arrayElemAt: ["$productInfo", 0] },
//         },
//       },
//       {
//         $group: {
//           _id: null,
//           total: { $sum: { $multiply: ["$quantity", "$productInfo.price"] } },
//         },
//       },
//     ]);
//     console.log(total);
//     // Store the total value in a session variable
//     // req.session.total = total[0].total;

//     console.log(total[0].total, "cart got");
//     res.render("user/address", {
//       video: true,
//       cartIcon: true,
//       user,
//       total,
//       address,
//     });
//   } catch (error) {
//     console.log(error);
//   }
// };

// exports.savedAddressget = async (req,res)=>{
//   let user = req.session.user
//   console.log(user,'user here')
//    // Access cartCount value from req object
//    const cartCount = req.cartCount;
//    const addressData  = await Address.find()
//    const address = addressData[0].address;

//    console.log(address,"address got")
//   try {
//     res.render('user/savedAddress',{video:true,user,cartCount,address})
//   } catch (error) {
//     console.log(error)
//   }
// }

// exports.savedAddressget = async (req, res) => {
//   let user = req.session.user;
//   let userId = req.session.user._id;
//   userId = userId.toString();
//   console.log(user, "user here");

//   const cartCount = req.cartCount;
//   const addressData = await Address.find({ user: user._id });

//   if (addressData && addressData.length > 0) {
//     const address = addressData[0].address;
//     console.log(address, "address got");

//     try {
//       res.render("user/savedAddress", {
//         video: true,
//         user,
//         cartCount,
//         address,
//       });
//     } catch (error) {
//       console.log(error);
//     }
//     json(true);
//   } else {
//     console.log("No address data found");
//     res.render("user/savedAddress", {
//       video: true,
//       user,
//       cartCount,
//       address: [],
//     });
//   }
//   // Clear any existing session data for address
//   req.session.address = null;
// };

// exports.editSavedAddressPost = async (req, res) => {
//   try {
//     const userId = req.session.user._id;
//     const addressId = req.params.id;

//     console.log(userId);
//     console.log(addressId);

//     const user = await Address.findOne({ user: userId });

//     const address = user.address.find((a) => a._id.toString() === addressId);
//     console.log(address, "address got");


//     const updatedAddress = {
//       firstname: req.body.firstname,
//       lastname: req.body.lastname,
//       state: req.body.state,
//       streetaddress: req.body.address,
//       appartment: req.body.appartment,
//       town: req.body.town,
//       zip: req.body.postcode,
//       mobile: req.body.mobile,
//       email: req.body.email,
//       radio: req.body.optradio,
//     };
    
//     const result = await Address.updateOne(
//       { user: userId, "address._id": new ObjectId(addressId) },
//       { $set: { "address.$": updatedAddress } }
//     );
    
//     console.log(result);
//     res.redirect('/savedAddress');

//   } catch (error) {
//     console.log(error);
//     res.status(500).send("Server Error");
//   }
// };

// exports.deleteAddress = async (req, res) => {
//   try {
//     const userId = req.session.user._id;
//     const addressId = req.params.id;

//     const result = await Address.updateOne(
//       { user: userId },
//       { $pull: { address: { _id: new ObjectId(addressId) } } }
//     );
    
//     console.log(result);
//     res.sendStatus(204);
//   } catch (error) {
//     console.log(error);
//     res.status(500).send("Server Error");
//   }
// };


// exports.savedAddressPost = async (req, res) => {
//   let user = req.session.user._id;
//   console.log(user, "user found");
//   console.log(req.body);
//   let addaddress = {
//     firstname: req.body.firstname,
//     lastname: req.body.lastname,
//     state: req.body.state,
//     streetaddress: req.body.address,
//     appartment: req.body.appartment,
//     town: req.body.town,
//     zip: req.body.postcode,
//     mobile: req.body.mobile,
//     email: req.body.email,
//     radio: req.body.optradio,
//   };
//   try {
//     const data = await Address.findOne({ user: user });
//     if (data) {
//       data.address.push(addaddress);
//       const updated_data = await Address.findOneAndUpdate(
//         { user: user },
//         { $set: { address: data.address } },
//         { returnDocument: "after" }
//       );
//       console.log(updated_data, "updated address collection");
//     } else {
//       const address = new Address({
//         user: req.session.user._id,
//         address: [addaddress],
//       });
//       const address_data = await address.save();
//       console.log(address_data, "address collection");
//     }

//     res.json(true);
//   } catch (error) {
//     console.log(error);
//   }
// };

// exports.editSavedAddress = async (req, res) => {
//   try {
//     let user = req.session.user;
//     // Access cartCount value from req object
//     const cartCount = req.cartCount;
//     console.log(req.params.id); // Check if id is coming in params
//     const address = await Address.findOne({ "address._id": req.params.id });
//     // Check if address is coming or not
//     // if (!address) {
//     //   return res.status(404).send("Address not found");
//     // }
//     const selectedAddress = address.address.find(
//       (addr) => addr._id.toString() === req.params.id
//     );
//     console.log(selectedAddress, "selectedAddress");
//     res.render("user/editSavedAddress", {
//       video: true,
//       user,
//       cartCount,
//       address: selectedAddress,
//     });
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send("Server Error");
//   }
// };

// exports.deliveryAddressPost = async (req, res) => {
//   let orders = req.body;
//   console.log(orders);
//   let cod = req.body['payment-method']
//   console.log(cod)
  
//   let addressId = new mongoose.Types.ObjectId(req.body.address);
  
//   console.log(addressId);
  
//   try {
//     const addressDetails = await Address.findOne(
//       { "address._id": addressId },
//       { "address.$": 1 }
//     );
//     console.log(addressDetails);
    
//     let filteredAddress = addressDetails.address[0]
//     console.log(filteredAddress)
//     console.log(filteredAddress.firstname)

//     let cart = await Cart.findOne({userId:req.session.user._id});
//     let userId =req.session.user._id;
//     console.log(cart,userId);


//     let total = await Cart.aggregate([
//       {
//         $match: { userId: userId },
//       },
//       {
//         $unwind: "$products",
//       },
//       {
//         $project: {
//           item: { $toObjectId: "$products.item" },
//           quantity: "$products.quantity",
//         },
//       },
//       {
//         $lookup: {
//           from: "products",
//           localField: "item",
//           foreignField: "_id",
//           as: "productInfo",
//         },
//       },
//       {
//         $project: {
//           item: 1,
//           quantity: 1,
//           productInfo: { $arrayElemAt: ["$productInfo", 0] },
//         },
//       },
//       {
//         $group: {
//           _id: null,
//           total: { $sum: { $multiply: ["$quantity", "$productInfo.price"] } },
//         },
//       },
//     ]).allowDiskUse(true);

   
//    console.log(cart.products,'nnnnnnnnnnnnnnnnnn')
//     // Store the total value in a session variable
//     // req.session.total = total[0].total;

//     console.log(total[0].total, "cart got");
//     let status = req.body['payment-method'] === 'COD' ? 'placed' : 'pending'

//     let orderObj = new Order({
//       deliveryDetails: {
//         firstname: filteredAddress.firstname,
//         lastname: filteredAddress.lastname,
//         state: filteredAddress.state,
//         streetaddress: filteredAddress.streetaddress,
//         appartment: filteredAddress.appartment,
//         town: filteredAddress.town,
//         zip: filteredAddress.zip,
//         mobile: filteredAddress.mobile,
//         email: filteredAddress.email,
//         radio: filteredAddress.radio
  
//       },
//       userId: cart.userId,
//       paymentMethod: req.body['payment-method'],
//       products: cart.products,
//       totalAmount: total[0].total,
//       paymentstatus: status,
//       deliverystatus:'not shipped',
//       createdAt: new Date()
  
//     });
//     console.log(orderObj)
//     let orderDoc = await Order.create(orderObj);
//     console.log(orderDoc, 'order createad')
//     let orderId = orderDoc._id
//     let orderIdString = orderId.toString();
//     console.log(orderIdString, 'order string')
//     // Find and delete the cart items for the user
//     await Cart.findOneAndDelete({ userId: cart.userId });
//     if (req.body['payment-method'] == 'COD') {
//     res.json({ codSuccess: true })
//     }else if (req.body['payment-method'] == 'RazorPay') {
//       console.log(orderDoc._id, 'iddd of order')
//       var options = {
//         amount: orderDoc.totalAmount * 100,  // amount in the smallest currency unit
//         currency: "INR",
//         receipt: orderIdString
//       };
//       instance.orders.create(options, function (err, order) {
//         console.log(order, 'new order');
//         res.json(order)
//       });
    
    
//     }else if (req.body['payment-method'] == 'PayPal') {

//     let amount = Math.floor(orderDoc.totalAmount/75);
//     console.log(amount,"///////")
//     amount = new String(amount)
//     console.log(amount,'amount 1')
//     const create_payment_json = {
//       intent: 'sale',
//       payer: {
//         payment_method: 'paypal'
//       },
//       redirect_urls: {
//         return_url: `http://localhost:3001/paymentsuccess/?objId=${orderId}`,
//         cancel_url: `http://localhost:3001/paypal-cancel/?objId=${orderId}`
//       },
//       transactions: [{
//         item_list: {
//           items: [{
//             name: 'item',
//             sku: 'item',
//             price: amount,
//             currency: 'USD',
//             quantity: 1
//           }]
//         },
//         amount: {
//           currency: 'USD',
//           total: amount
//         },
//         description: 'This is the payment description.'
//       }]
//     };

//     paypal.payment.create(create_payment_json, function (error, payment) {
//       if (error) {
//         console.log(error);
//       } else {
//         console.log('Create Payment Response');
//         console.log(payment);
//         console.log(payment.links[1].href, 'link')
//         console.log(payment.links,"payment link")
//         console.log(payment.links[1],"payment link[1]")
//         // Check that payment.links[1] exists
//         if (payment.links && payment.links[1]) {
//           // Redirect the user to the PayPal checkout page
//           res.json({ payment });
//         } else {
//           console.log('Payment response missing redirect URL');
//           res.status(500).send('Unable to process payment');
//         }
//       }

//     });

//   }} catch (error) {
//     console.log(error);
//   }
// };

// exports.successPagePayPal = async (req, res) => {
//   try{
//   const payerId = req.query.PayerID;
//   const paymentId = req.query.paymentId;
//   let objId = req.query.objId;
//   console.log(objId, 'obj id')
//   let orderDoc = await Order.findOne({_id:objId})
//   let amount = Math.floor(orderDoc.totalAmount/75)
//   amount = new String(amount)
//   console.log(amount,'amount')
//   const execute_payment_json = {
//     payer_id: payerId,
//     transactions: [
//       {
//         amount: {
//           currency: "USD",
//           total: amount,
//         },
//       },
//     ],
//   };
//   await Order.updateOne(
//     { _id: objId },
//     {
//       $set: {
//         paymentstatus: 'placed'
//       }
//     })
//   paypal.payment.execute(
//     paymentId,
//     execute_payment_json,
//     function (error, payment) {

//         res.redirect('/orderPlaced')
      
//     }
//   );
//   }catch(error){
//     console.log(error,'eror')
//   }
// }

// exports.cancelPagePayPal = async (req, res) => {
//   let objId = req.query.objId;
//   await Order.updateOne(
//     { _id: objId },
//     {
//       $set: {
//         paymentstatus: 'failed'
//       }
//     })
//   res.redirect('/payment-failed')
// }

// exports.paymentVerify =async (req,res)=>{

//   console.log(req.body ,'..success of order')

//   try {
//     let details = req.body;
//     const crypto = require('crypto');
//     let hmac = crypto.createHmac('sha256', 'NU1nWwREDDpDVKdjog8bUFrj');


//     hmac.update(details.payment.razorpay_order_id + '|' + details.payment.razorpay_payment_id);
//     hmac = hmac.digest('hex')
//     const razorpayOrderId = req.body.payment.razorpay_order_id;
//     const razorpayPaymentId = req.body.payment.razorpay_payment_id;
//     const razorpaySignature = req.body.payment.razorpay_signature;
//     console.log(req.body.payment.razorpay_order_id)
//     console.log(req.body.payment.razorpay_payment_id)
//     console.log(req.body.payment.razorpay_signature)


//     console.log(req.body.order.receipt);
//     let orderResponse = req.body.order.receipt
//     console.log(orderResponse,"????????????")
//     let orderObjId = new ObjectId(orderResponse);
//     console.log(";;;;;;;;;;;;;;;;;")
//     console.log(hmac,"///////////")
//     console.log(req.body.payment.razorpay_signature,"🔥🔥🔥")

//     if (hmac == details.payment.razorpay_signature) {

//       await Order.updateOne(
//         { _id: orderObjId },
//         {
//           $set: {
//             paymentstatus: 'placed'
//           }
//         })


//       console.log("payment is successful");
//       res.json({ status: true })

//     } else {

//       await Order.updateOne(
//         { _id: orderObjId },
//         {
//           $set: {
//             paymentstatus: 'failed'
//           }
//         })
//       console.log("payment is failed");
//       res.json({ status: false, errMsg: '' })

//     }
//   } catch (error) {
//     console.log(error, 'error')
//   }
// }

// exports.paymentFailed = async (req, res) => {
//   res.render('user/paymentFailed',{other:true})
// }



// exports.orderPlacedCod = (req,res)=>{

//   let user = req.session.user
  
//   try {
//     res.render('user/OrderPlacedCod',{video:true,user, cartIcon: true});
//   } catch (error) {
//     console.log(error);
//     res.status(500).send('Internal Server Error');
//   }
// }

// exports.orders = async (req, res) => {
  

//   try {
//     const userId = req.session.user._id;
//     console.log(userId,"lksdfjglkjdlsafkjglkaj")
//     let orders = await Order.find({ userId: userId });
//     console.log(orders)
//     res.render('user/OrderView.ejs', { video: true, user: req.session.user, orders: orders });
//   } catch (error) {
//     res.status(500).send('Internal Server Error');
//   }
// }


// exports.viewOrderProducts = async (req,res)=>{
//   let user = req.session.user
//   let order = req.params.id
//     let cond =new ObjectId(order)
//     console.log(cond)
//     console.log(order,"lkjkljlkjlkjkklllllllll")

//   try {
    

//    // Fetch the cart items
// let cartItems = await Order.aggregate([
//   {
//     $match: { _id: cond },
//   },
  
//   {
//     $lookup: {
//       from: "products",
//       localField: 'products.item',
//       foreignField: "_id",
//       as:"productInfo",
//     },
//   }
 
// ]);
// console.log(cartItems[0].products,"💥💥💥")
// console.log(cartItems[0].productInfo,"hgjhgjhgjhgjhgjhghg");
// // Add the quantity of each product to the corresponding product object
// cartItems[0].productInfo.forEach((product, index) => {
//   product.quantity = cartItems[0].products[index].quantity;
// });

// res.render("user/viewProductDetails",{ user,video:true, products: cartItems[0].productInfo })
    


//   } catch (error) {
//     console.log(error);
//     res.status(500).send('Internal server error');
//   }
// }










// exports.filterPost = async (req, res) => {
//   console.log("////////////");

//   let category = req.params.category;
//     let brand = req.params.brands;
//     console.log(category)
//     console.log(brand)




//   // get the category ID from the request parameters
//   var categoryId = req.params.categoryId;
//   console.log(categoryId, '🔥🔥🔥');

//   try {
//     const products = await Product.find({ category: categoryId });
//     console.log(products);
//     res.json(products); // Return the products as a JSON response
//   } catch (error) {
//     console.log(error);
//   }
// };


// exports.filterSub = async (req,res)=>{
 
//  const sub = req.params.subcategoryId
//  console.log(sub)
 
//   try {
//     const products = await Product.find({ subcategory: sub });
//     console.log(products)

//     // Send the filtered products to the client
//     res.json(products);
   
//   } catch (error) {
//     console.log(error)
//   }
// }