const redis = require('redis');

const redisPort = 6379;
const client = redis.createClient({host: 'redis', port: redisPort});
client.on('error', (err) => {
  console.log(err); //eslint-disable-line
});

const { getProduct, getStyles } = require('../db/utils');

const app = require('./server');

app.get('/loaderio*', async (req, res) => {
  res.status(200).send('loaderio-3ab2e7ca8cc7c87863235552afb40f7a');
});

app.get('/product/:productId', async (req, res) => {
  console.log('Got a request!'); //eslint-disable-line
  const { productId } = req.params;
  // get product data from database
  let product;
  try {
    client.hget('products', productId, async (err, cachedProduct) => {
      if (err) throw err;

      if (cachedProduct) {
        res.status(200).send(JSON.parse(cachedProduct));
      } else {
        product = await getProduct(productId);
        client.hset('products', productId, JSON.stringify(product));
        res.status(200).send(product);
      }
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/product/:productId/styles', async (req, res) => {
  const { productId } = req.params;
  // get style data from database
  let styles;
  try {
    client.hget('styles', `${productId}_styles`, async (err, cachedStyles) => {
      if (err) throw err;

      if (cachedStyles) {
        res.status(200).send(JSON.parse(cachedStyles));
      } else {
        styles = await getStyles(productId);
        client.hset('styles',`${productId}_styles`, JSON.stringify(styles));
        res.status(200).send({ productId, results: styles });
      }
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.listen(5000, () => {
    console.log(`Express Server is running on port 5000`); // eslint-disable-line
});
