// Main Variables
var balance = { 'usd':0, 'btc':0 };
var price = { 'bid':0, 'ask':0, 'last':0 };
var timers = { 'last': Date.now(), 'update':30, 'spread':0.5 };
var limits = { 'balance': { 'usd':0 }, 'tx': { 'usd':0, 'time': 60 * 1000 } };
var fees = { 'tx': 0.01, 'address':'1btcaddress' };
var data = { 'balance':balance, 'price':price, 'timers':timers };

// RESTful API Server
var restify = require('restify');
var server = restify.createServer();
server.use(restify.acceptParser(server.acceptable));
server.use(restify.bodyParser());
server.use(restify.queryParser());

server.get('/balances', apiGetBalances);
server.post('/transactions', apiPostTransactions);

server.listen(8080, function() {
  console.log('%s listening at %s', server.name, server.url);
});

// Timed Events 
var counter = 0;
var update = setInterval( updatePrice, timers.update * 1000);

// Function Declarations
function apiGetBalances(req, res, next) {
  res.send(balance);
  next();
}

function apiPostTransactions(req, res, next) {
  var tx = JSON.parse(req.body);
  tx.id = Date.now();

  switch (tx.type) {
    case "seed":  
      if (tx.usd) { balance.usd += parseFloat(tx.usd); }
      if (tx.btc) { balance.btc += parseFloat(tx.btc); }
      console.log (JSON.stringify(tx));
      console.log (JSON.stringify(balance));

      limits.balance.usd = balance.usd * 2;
      limits.tx.usd = limits.balance.usd * 0.1;
      console.log (JSON.stringify(limits));

      price.ask = balance.usd / balance.btc;
      price.bid = balance.usd / balance.btc;
      displayPrice();

      res.send(data);
      break;
    case "buy":
      // In the event a customer buys bitcoin, and we have too much USD, the ask price 
      // should increase by the percentage that the USD balance moved closer to the upper
      // limit.  If we are low on USD, the ask price should stay the same.
      if (tx.usd) {
        tx.usd = parseFloat(tx.usd);

        // Calculate the BTC to be delivered and the fee
        tx.btc = tx.usd / price.ask;
        tx.fee = tx.btc * fees.tx;
        tx.btc = tx.btc - tx.fee;

        // Make sure we're not violating transaction or balance limits
        if ( tx.usd <= limits.tx.usd && 
             balance.usd + tx.usd <= limits.balance.usd &&
             balance.btc - tx.btc >= 0.0001 ) { 
          // Store the last balance to memory
          var last = { 'usd': balance.usd, 'btc': balance.btc };

          // Stub to send BTC to recipient and cold-wallet
          console.log (JSON.stringify(tx));
          res.send({ 'success' : 'Sending ' + tx.btc + ' BTC' });

          // Adjust Balances and Last Price
          balance.usd += tx.usd; 
          balance.btc -= tx.btc + tx.fee;
          price.last = price.ask;
          timers.last = Date.now();
          console.log (JSON.stringify(balance));

          // Do we need to adjust the ask?
//          if (balance.usd > limits.balance.usd / 2) {
            var increase = 0;

            // If the previous balance was less than the midpoint, we use the difference
            // between now and the midpoint.
            // Otherwise we use the difference between now and the previous balance 
 //           if (last.usd <= limits.balance.usd / 2) {
 //             increase = (balance.usd - (limits.balance.usd / 2)) / (limits.balance.usd / 2);
 //           } else {
 //             increase = (balance.usd - last.usd) / last.usd;
 //           }
            increase = (balance.usd - last.usd) / (limits.balance.usd / 2);

            // Now adjust the ask
            price.ask = price.ask * (1 + increase);
            displayPrice();
//          }
        } else {
          res.send({ 'error' : 'Amount exceeds balance or transaction limits.' });
        }
      } else {
        res.send({ 'error' : 'Invalid amount.' });
      }  
      break;  
    case "sell":
      // In the event a customer sells bitcoin, and we have too little USD, the bid price
      // should decrease by the percentage that the USD balance moved closer to zero. If we
      // are high on USD, the bid price should stay the same.
      if (tx.usd) {
        tx.usd = parseFloat(tx.usd);
        // Make sure we're not violating transaction or balance limits
        if ( tx.usd <= limits.tx.usd && balance.usd - tx.usd >= 1 ) { 
          // Store the last balance to memory
          var last = { 'usd': balance.usd, 'btc': balance.btc };

          // Calculate the BTC to be delivered and the fee
          tx.btc = tx.usd / price.bid;
          tx.fee = tx.btc * fees.tx;
          tx.btc = tx.btc + tx.fee;

          // Stub to receive BTC from recipient and send the commission to cold-wallet
          console.log (JSON.stringify(tx));
          res.send({ 'success' : 'Receiving ' + tx.btc + ' BTC' });

          // Adjust Balances and Last Price
          balance.usd -= tx.usd; 
          balance.btc += tx.btc - tx.fee;
          price.last = price.bid;
          timers.last = Date.now();
          console.log (JSON.stringify(balance));

          // Do we need to adjust the bid?
//          if (balance.usd < limits.balance.usd / 2) {
            var decrease = 0;

            // If the previous balance was more than the midpoint, we use the difference
            // between now and the midpoint.
            // Otherwise we use the difference between now and the previous balance 
//            if (last.usd >= limits.balance.usd / 2) {
//              decrease = ((limits.balance.usd / 2) - balance.usd) / (limits.balance.usd / 2);
//            } else {
//              decrease = (last.usd - balance.usd) / last.usd;
//            }
            decrease = (last.usd - balance.usd) / (limits.balance.usd / 2);

            // Now adjust the bid
            price.bid = price.bid * (1 - decrease);
            displayPrice();
 //         }
        } else {
          res.send({ 'error' : 'Amount exceeds balance or transaction limits.' });
        }
      } else {
        res.send({ 'error' : 'Invalid amount.' });
      }  
      break;  
    default:
      res.send({ 'error' : 'Transaction type ' + tx.type + ' invalid' });
      break;
  }
  next();
}

function updatePrice() {
  // This function is designed to reduce the spread, in order to increase 
  // business. It will lower the ask price and raise the bid price each by
  // a tuneable value.
  var calc = { 'spread' : 0, 'adjust' : 0, 'ideal' : 0, 'gap' : 0 };
  calc.spread = price.ask - price.bid;
  calc.adjust = calc.spread * timers.spread;
  calc.ideal  = balance.usd / balance.btc;
  console.log(JSON.stringify(calc));
  
  if (calc.spread > 0) {
    // Adjust the bid and ask towards the ideal
    if (price.bid > calc.ideal) {
      calc.gap = price.bid - calc.ideal;
      price.bid -= calc.gap * 0.5;
    }
    if (price.ask < calc.ideal) {
      calc.gap = calc.ideal - price.ask;
      price.ask += calc.gap * 0.5;
    }

    // Weight the spread adjust based on balance imbalance
    if (balance.usd > (limits.balance.usd / 2)) {
      price.ask -= calc.adjust * (1/3);
      price.bid += calc.adjust * (2/3);
    }
    if (balance.usd < (limits.balance.usd / 2)) {
      price.ask -= calc.adjust * (2/3);
      price.bid += calc.adjust * (1/3);
    }
    if (balance.usd == (limits.balance.usd / 2)) {
      price.ask -= calc.adjust * (1/2);
      price.bid += calc.adjust * (1/2);
    }

    displayPrice();
  }
}

function displayPrice() {
  console.log(JSON.stringify(price));
}
