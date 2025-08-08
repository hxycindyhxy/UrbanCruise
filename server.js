// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});


app.get('/cars', (req, res) => {
  fs.readFile(path.join(__dirname, 'cars.json'), 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'read cars.json fail' });
    const obj = JSON.parse(data);
    res.json(obj.cars);
  });
});

app.get('/availability', (req, res) => {
  const vin = req.query.vin;
  fs.readFile(path.join(__dirname, 'cars.json'), 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'read cars.json fail' });
    const cars = JSON.parse(data).cars;
    const car = cars.find(c => c.vin === vin);
    res.json({ available: car ? car.available : false });
  });
});

app.post('/order', (req, res) => {
  const newOrder = req.body;

  const ordersPath = path.join(__dirname, 'orders.json');
  fs.readFile(ordersPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'read orders.json fail' });
    const ordersObj = JSON.parse(data);
    ordersObj.orders.push(newOrder);
    fs.writeFile(ordersPath, JSON.stringify(ordersObj, null, 2), err => {
      if (err) console.error(err);
    });
  });
 
  const carsPath = path.join(__dirname, 'cars.json');
  fs.readFile(carsPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'read cars.json fail' });
    const carsObj = JSON.parse(data);
    const car = carsObj.cars.find(c => c.vin === newOrder.car.vin);
    if (car) car.available = false;
    fs.writeFile(carsPath, JSON.stringify(carsObj, null, 2), err => {
      if (err) console.error(err);
    });
  });

  res.json({ success: true });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server start, visit http://localhost:${PORT}`);
});
