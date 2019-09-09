/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
const mongoose = require('mongoose')
const request = require('request-promise-native')

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});
mongoose.connect(process.env.DB, {useNewUrlParser: true})

const stockSchema = new mongoose.Schema({
  stock: {
    type: String,
    required: true
  },
  price: {
    type:String,
    required: true
  },
  likes: {
    type: Number,
    required: true,
    default: 0
  }
})


const Stock = mongoose.model('Stock', stockSchema)

const makeNewStock = (stockData) => {
  return new Stock({
    stock: stockData.ticker,
    price: stockData.price
  })
}

const makeOneFormatted = ({stock, price, likes}) => {
  return {
    stockData: {
      stock,
      price,
      likes
    }
  }
}

const makeTwoFormatted = (stockOne, stockTwo) => {
  return {
    stockData: [{
      stock: stockOne.stock,
      price: stockOne.price,
      rel_likes: stockOne.likes - stockTwo.likes
    }  , {
      stock: stockTwo.stock,
      price: stockTwo.price,
      rel_likes: stockTwo.likes - stockOne.likes
      
    }]
  }
}


module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(async function (req, res){
// to see if one or two stocks
    if (Array.isArray(req.query.stock)){
   // two stocks
    }
    else {// only one stock
      const stock = await Stock.findOne({stock: req.query.stock.toUpperCase()})
      if (stock){ // if it's in the db, 
        console.log("found in db!")
        if (req.query.like == 'true') {stock.likes=1}
      
        
        // update price
    try{
        const data = await request(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${req.query.stock}&apikey=${process.env.APIKEY}`)
        const obj = await JSON.parse(data)
        if (!obj){ return res.status(400).send('no ticker with that symbol OR maxxed out api calls')}
          
        const price = await obj['Global Quote']['05. price']
        stock.price = price
      await stock.save()
        return res.send(makeOneFormatted(stock))
        }catch(e){return res.status(400)}
        

      }
      else { // request new stock info
        try{
          const data = await request(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${req.query.stock}&apikey=${process.env.APIKEY}`)
          const obj = await JSON.parse(data)
          if (!obj){ return res.status(400).send('no ticker with that symbol OR maxxed out api calls')}
          
          const price = await obj['Global Quote']['05. price']
          const name = await obj['Global Quote']['01. symbol']
          
          let likes
          if (req.query.like =='true'){likes = 1 }
          const stock = new Stock ({
            stock: name,
            price, 
            likes
          })
          await stock.save()
          res.send(makeOneFormatted(stock))
          }
          catch(e){
            console.log(e)
            }
      //   const user = await getStockData(req.query.stock)
      //   await user.save()
      //   res.send(user)
       }
    }
    
    
    
    
    });
    
};
