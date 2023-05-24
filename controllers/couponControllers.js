const Coupon = require("../models/couponSchema");
const User = require("../models/userSchema");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

exports.applyCoupon = async (req, res) => {
    console.log(req.body, "...coupon id ");
    cartTotal = parseInt(req.body.total.replace(/\D/g, ""));
  
    let matchCouponId = await Coupon.findOne({
      couponCode: req.body.couponId,
      statusEnable: true, // check if the coupon is enabled
      expires: { $gt: Date.now() }, // check if the current date is before the expiry date
    });
    console.log(cartTotal, "totalparseInt");
    console.log(matchCouponId, "original");
    if (!matchCouponId) {
      return await res.json({ message: "Invalid coupon code" ,success: false});
    } else if (cartTotal < matchCouponId.minPurchase) {
      return await res.json({
        message: `Coupon requires minimum purchase of Rs . ${matchCouponId.minPurchase}`,success: false
      });
        
      
    } else {
      let discountPercentage = (matchCouponId.discount / cartTotal) * 100;
      let discountAmount = matchCouponId.discount;
      console.log(discountPercentage);
      console.log(discountAmount);
      res.json({
        message: `Coupon applied! You received a discount of Rs. ${discountAmount} (${discountPercentage}% of the total ${cartTotal})`,
        success: true,
        discountAmount,
        discountPercentage,
        cartTotal,
      });
    }
}