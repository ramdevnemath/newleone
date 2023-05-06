const mongoose = require('mongoose')
const Schema = mongoose.Schema

const productSchema = new Schema({
    productName:{
        type : String,
        required : true
    },
    company:{
        type : String,
        require : true
    },
    type:{
        type : String,
        required:false
    },
    description: {
        type: String,
        required: false
    },
    // category: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Category',
    //     required: true
    // },
    // subcategory:{
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'SubCategory',
    //     required: true
    //   },
    // deal:{
    //     type : String,
    //     required : true
    // },
    price:{
        type : String,
        required : true
    },
    image:[
        { type : String }
    ],
    stock: {
        type: Number,
        required: true
    }
    // deleted: {
    //     type: Boolean,
    //     default: false
    // }
})

//model name: "Product" will be used to turn into a collection name in DB
//"Product" => 'product' + 's' => products
module.exports = mongoose.model('Product',productSchema)