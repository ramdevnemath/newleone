const Coupon = require("../models/couponSchema");
const User = require("../models/userSchema");
var voucher_codes = require("voucher-code-generator");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

exports.couponPage = async (req, res) => {
  let adminDetails = req.session.admin;
  let coupon = await Coupon.find();

  res.locals.coupon = coupon;
  res.render("admin/coupon", { admin: true, adminDetails, error: '' });
};

exports.postCoupon = async (req, res) => {
  let adminDetails = req.session.admin;
  let coupon = await Coupon.find();
  res.locals.coupon = coupon;
  if (req.body.discount >= 0) {
    const voucher = voucher_codes.generate({
      prefix: "CODE-",
      length: 7,
      charset: voucher_codes.charset("alphabetic"),
      postfix: "-OFF",
    });
    let strCoupon = voucher.toString();
    const newCoupon = new Coupon({
      couponCode: strCoupon,
      discount: req.body.discount,
      minPurchase: req.body.minPurchase,
      expires: req.body.expires,
      statusEnable: true,
    });
    await Coupon.create(newCoupon);

    res.redirect("/admin/coupon");
  } else {
    res.render('admin/coupon', { admin: true, error: "Discount cannot be negative", adminDetails })
  }
};

exports.disableCoupon = async (req, res) => {
  try {
    await Coupon.findByIdAndUpdate(
      { _id: req.params.id },
      {
        statusEnable: false,
      }
    );

    await res.json(true);
  } catch (error) {
    console.log(error);
  }
};

exports.enableCoupon = async (req, res) => {
  try {
    await Coupon.findByIdAndUpdate(
      { _id: req.params.id },
      {
        statusEnable: true,
      }
    );

    await res.json(true);
  } catch (error) {
    console.log(error);
  }
};

exports.editCoupon = async (req, res) => {
  try {
    let couponId = req.query.couponId;
    let couponDetails = await Coupon.findOne({ _id: couponId });
    res.json(couponDetails);
  } catch (error) {
    console.log(error);
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    let { couponId, couponCode, couponDiscount, couponMinPurchase, couponExp } =
      req.body;
    let updatedCoupn = await Coupon.findByIdAndUpdate(
      { _id: couponId },
      {
        couponCode: couponCode,
        discount: couponDiscount,
        minPurchase: couponMinPurchase,
        expires: couponExp,
      },
      { new: true }
    );
    await res.json(updatedCoupn);
  } catch (error) {
    console.log(error);
  }
};

exports.applyCoupon = async (req, res) => {
  cartTotal = parseInt(req.body.total.replace(/\D/g, ""));
    var matchCouponId = await Coupon.findOne({
      couponCode: req.body.couponId,
      statusEnable: true, // check if the coupon is enabled
      expires: { $gt: Date.now() }, // check if the current date is before the expiry date
    });
  if (!matchCouponId) {
    return await res.json({ message: "Invalid coupon code", success: false });
  } else if (cartTotal < matchCouponId.minPurchase) {
    return await res.json({
      message: `Coupon requires minimum purchase of Rs . ${matchCouponId.minPurchase}`, success: false
    });
  } else if (cartTotal < matchCouponId.discount) {
    return await res.json({
      message: `Coupon amount exceeds total amount`
    });
  } else {
    let discountPercentage = (matchCouponId.discount / cartTotal) * 100;
    let discountAmount = matchCouponId.discount;
    res.json({
      message: `Coupon applied! You received a discount of Rs. ${discountAmount} (${discountPercentage}% of the total ${cartTotal})`,
      success: true,
      discountAmount,
      discountPercentage,
      cartTotal,
    });
  }
};

exports.getReward = async (req, res) => {
  try {
    let user = req.session.user;
    // Access cartCount value from req object
    const cartCount = req.cartCount;
    // Fetch all coupon details from the database
    const coupons = await Coupon.find();
    res.render('user/rewards', { video: true, user, cartCount, coupons })
  } catch (error) {
    console.log(error)
  }
}