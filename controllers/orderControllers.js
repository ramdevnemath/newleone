const Order = require("../models/orderSchema");
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

exports.orderPlacedCod = (req, res) => {
    let user = req.session.user;
  
    try {
      res.render("users/OrderPlacedCod", { video: true, user, cartIcon: true });
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server Error");
    }
  };
  
  exports.orders = async (req, res) => {
    let orders = await Order.find({ userId: req.session.user._id })
      .sort("-updatedAt")
      .populate({
        path: "products.item",
        model: "Product",
      })
      .exec();
  
    console.log(orders);
    // console.log(orders[0].products)
    const cartCount = req.cartCount;
    if (req.session.filterOrders) {
      res.locals.orders = req.session.filterOrders;
      req.session.filterOrders = null;
    } else if (req.session.noOrders) {
      res.locals.orders = req.session.noOrders;
      req.session.noOrders = null;
    } else if (req.session.cancelledOrders) {
      res.locals.orders = req.session.cancelledOrders;
      req.session.cancelledOrders = null;
    } else if (req.session.notShippedOrders) {
      res.locals.orders = req.session.notShippedOrders;
      req.session.notShippedOrders = null;
    } else if (req.session.returneddOrders) {
      res.locals.orders = req.session.returneddOrders;
      req.session.returneddOrders = null;
    } else {
      res.locals.orders = orders;
    }
    res.render("users/OrderView", {
      footer: false,
      cartCount,
      user: req.session.user,
    });
  };
  
  exports.viewOrderProducts = async (req, res) => {
    try {
      const orderId = req.params.id;
      const order = await Order.findById(orderId)
        .populate({
          path: "products.item",
          model: "Product",
        })
        .exec();
      
      if (!order) {
        return res.status(404).send("Order not found");
      }

      const orderedProducts = order.products.map((product) => {
        return {
          product: product.item,
          quantity: product.quantity,
        };
      });

      res.render("users/viewProductDetails", {
        footer: false,
        user: req.session.user,
        order,
        orderedProducts,
      });

    } catch (error) {
      console.log(error);
      res.status(500).send("Internal server error");
    }
  };

  exports.cancelOrder =async(req,res)=>{
    console.log("raman kundan");
 
    let productId = req.query.productId
    let orderId = req.query.orderId;
    console.log(productId,orderId,'first pro second order')
  
    let orders = await Order.find({ _id: orderId })
    .populate({
      path: 'products.item',
      model: 'Product'
    }).exec();
  
  
    let product = null;
    for (let i = 0; i < orders.length; i++) {
      let order = orders[i];
      product = order.products.find(product => product.item._id.toString() === productId);
      if (product) {
        product.orderstatus = 'cancelled';
        product.deliverystatus ='cancelled';
        await order.save();
        break; // Exit the loop once product is found
      }
    }
    console.log(orders,'total')
    console.log(product,'igot the product')
    res.redirect('/orders')
  
  }