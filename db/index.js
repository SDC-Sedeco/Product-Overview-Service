/* eslint-disable no-unused-vars */
const { MongoClient } = require('mongodb');
const csv = require('csv-parser');
const fs = require('fs');

const url = 'mongodb://127.0.0.1:27017/';

// MongoClient.connect(url, (err, database) => {
//   if (err) {
//     console.error(err); // eslint-disable-line
//   }
//   const db = database.db('test');

//   db.createCollection('base_products', (productCollectionError, productCollectionRes) => {
//     if (productCollectionError) {
//       console.error(productCollectionError); // eslint-disable-line
//     }
//     console.log('products created'); // eslint-disable-line
//   });

//   db.createCollection('features', (featuresCollectionError, featuresCollectionRes) => {
//     if (featuresCollectionError) {
//       console.error(featuresCollectionError); // eslint-disable-line
//     }
//     console.log('features created'); // eslint-disable-line
//   });

//   db.createCollection('init_styles', (stylesCollectionError, stylesCollectionRes) => {
//     if (stylesCollectionError) {
//       console.error(stylesCollectionError); // eslint-disable-line
//     }
//     console.log('styles created'); // eslint-disable-line
//   });

//   db.createCollection('skus', (skusCollectionError, skusCollectionRes) => {
//     if (skusCollectionError) {
//       console.error(skusCollectionError); // eslint-disable-line
//     }
//     console.log('skus created'); // eslint-disable-line
//   });

//   db.createCollection('photos', (photosCollectionError, photosCollectionRes) => {
//     if (photosCollectionError) {
//       console.error(photosCollectionError); // eslint-disable-line
//     }
//     console.log('photos created'); // eslint-disable-line
//   });

//   const loadCSVData = async () => {
//     const products = [];
//     const features = [];
//     const styles = [];
//     const skus = [];
//     const photos = [];

//     try {
//       await fs.createReadStream('samples/testProduct.csv')
//         .pipe(csv())
//         .on('data', (data) => products.push(data))
//         .on('end', () => {
//           db.base_products.create(products);

//           fs.createReadStream('samples/testFeatures.csv')
//             .pipe(csv())
//             .on('data', (data) => features.push(data))
//             .on('end', () => {
//               db.sampleFeatures.create(features);

//               fs.createReadStream('samples/testStyles.csv')
//                 .pipe(csv())
//                 .on('data', (data) => styles.push(data))
//                 .on('end', () => {
//                   db.styles.create(styles);

//                   fs.createReadStream('samples/testSkus.csv')
//                     .pipe(csv())
//                     .on('data', (data) => skus.push(data))
//                     .on('end', () => {
//                       db.skus.create(skus);

//                       fs.createReadStream('samples/testPhotos.csv')
//                         .pipe(csv())
//                         .on('data', (data) => photos.push(data))
//                         .on('end', () => {
//                           db.photos.create(photos);
//                         });
//                     });
//                 });
//             });
//         });
//     } catch (error) {
//       console.error(error); // eslint-disable-line
//     }
//   };

//   loadCSVData()
//     .then(() => {
//       console.log('all tables should be inserted'); // eslint-disable-line
//     });

// concat products and features together
// db.base_products.aggregate([
//   {
//     $lookup: {
//       from: 'features',
//       localField: 'id',
//       foreignField: 'product_id',
//       as: 'tempfeatures',
//     },
//   },
//   {
//     $project:
//   {
//     features: {
//       $map: {
//         input: '$tempfeatures',
//         as: 'feature',
//         in: {
//           feature: '$$feature.feature',
//           value: '$$feature.value',
//         },
//       },
//     },
//     id: 1,
//     name: 1,
//     slogan: 1,
//     description: 1,
//     category: 1,
//     default_price: 1,
//   },
//   },
//   { $out: 'products' }, // ADD INDEX FOR ID
// ]);

// // concat styles, photos and skus together
// // break into two aggregations, which might be faster?
// db.init_styles.aggregate([
//   {
//     $lookup: {
//       from: 'photos',
//       localField: 'id',
//       foreignField: 'styleId',
//       as: 'tempphotos',
//     },
//   },
//   {
//     $project: {
//       photos: {
//         $map: {
//           input: '$tempphotos',
//           as: 'photo',
//           in: {
//             thumbnail_url: '$$photo.thumbnail_url',
//             url: '$$photo.url',
//           },
//         },
//       },
//       productId: 1,
//       style_id: '$id',
//       name: 1,
//       sale_price: 1,
//       original_price: 1,
//       'default?': {
//         $cond: [{ $eq: ['$default_style', 1] }, true, false],
//       },
//     },
//   },
//   { $out: 'styles' },
// ]);

//   db.close();
// });

let connection;
let db;

const connectToDatabase = async () => {
  connection = await MongoClient.connect(url, { useNewUrlParser: true });
  db = await connection.db('test');
};

const getProduct = (
  productId,
  collection,
) => db.collection(collection).findOne({ id: parseInt(productId, 10) });

const getStyles = (productId, primaryCollection, secondaryCollection) => {
  const aggCursor = db.collection(primaryCollection).aggregate([
    {
      $match: {
        productId: parseInt(productId, 10), // ADD INDEX FOR PRODUCTID
      },
    },
    {
      $lookup: {
        from: secondaryCollection,
        localField: 'style_id', // ADD INDEX FOR STYLE_ID
        foreignField: 'styleId', // ADD INDEX FOR STYLEID
        as: 'tempskus',
      },
    },
    {
      $project: {
        skus: {
          $arrayToObject: {
            $map: {
              input: '$tempskus',
              as: 'sku',
              in: {
                k: { $toString: '$$sku.id' },
                v: {
                  size: '$$sku.size',
                  quantity: '$$sku.quantity',
                },
              },
            },
          },
        },
        productId: 1,
        style_id: 1,
        name: 1,
        sale_price: 1,
        original_price: 1,
        'default?': 1,
        photos: 1,
      },
    },
  ]);

  const styles = [];
  const asyncGetStyles = async () => {
    await aggCursor.forEach((style) => {
      styles.push(style);
    });

    return new Promise((resolve, reject) => {
      resolve(styles);
    });
  };

  return asyncGetStyles();
};

module.exports = {
  connectToDatabase,
  db,
  getProduct,
  getStyles,
};
