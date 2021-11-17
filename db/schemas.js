/* eslint-disable no-unused-vars */
const mongoose = require('mongoose');
require('dotenv').config();

// mongoose.connect(`mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_URL}/test`);
mongoose.connect('mongodb://db:27017/test');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:')); //eslint-disable-line
// db.once('open', () => console.log('db connected!')); //eslint-disable-line

const { Schema } = mongoose;
const productSchema = new Schema({
  id: Number,
  name: String,
  slogan: String,
  description: String,
  category: String,
  default_price: String,
  features: [
    {
      feature: String,
      value: String,
    },
  ],
});

const Product = mongoose.model('Product', productSchema, 'products');

const styleSchema = new Schema({
  productId: Number,
  style_id: Number,
  name: String,
  original_price: String,
  sale_price: String || null,
  default: Boolean,
  photos: [
    {
      thumbnail_url: String,
      url: String,
    },
  ],
});

const Styles = mongoose.model('Styles', productSchema, 'styles');

const skuSchema = new Schema({
  id: Number,
  style_id: Number,
  size: String,
  quantity: Number,
});

const Skus = mongoose.model('Skus', productSchema, 'skus');

module.exports = {
  Product,
  Styles,
  Skus,
  productSchema,
  styleSchema,
  skuSchema,
};
