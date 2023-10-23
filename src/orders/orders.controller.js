const path = require("path");
// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));
// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");
// TODO: Implement the /orders handlers needed to make the tests pass
const dishes = require("../data/dishes-data");

function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes: dishArray } = {} } =
    req.body;

  if (!Array.isArray(dishArray) || dishArray.length === 0) {
    res.status(400).json({ error: 'dish' });
    return;
  }

  const matchedDishes = [];

  for (const dish of dishArray) {
    const index = dishArray.indexOf(dish);
          
    if (!dish.quantity) {
      res.status(400).json({ error: `Dish ${index} must have a quantity that is an integer greater than 0` });
      return; 
    }

    if (!Number.isInteger(dish.quantity) || dish.quantity <= 0) {
      res.status(400).json({ error: `Dish ${index} must have a quantity that is an integer greater than 0` });
      return; 
    }

    const matchedDish = dishes.find((dataDish) => dataDish.id === dish.id);
    if (matchedDish) {
      matchedDishes.push({
        id: matchedDish.id,
        name: matchedDish.name,
        description: matchedDish.description,
        image_url: matchedDish.image_url,
        price: matchedDish.price,
        quantity: dish.quantity,
      });
    }
  }

  const newOrder = {
    id: nextId(),
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status,
    dishes: matchedDishes,
  };

  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

//========================================


function read(req, res) {
  res.json({ data: req.foundOrder });
}

//=========================================

function update(req, res, next) {
  const { orderId } = req.params;
  const { data: { id, deliverTo, mobileNumber, status, dishes } } = req.body;
  
  const foundOrder = orders.find((order) => order.id === orderId);

  if (!foundOrder) {
    return next({
      status: 400,
      message: `Order with id ${orderId} not found`,
    });
  }

  if (id !== undefined && id !== orderId && id !== '' && id !== null) {
    return next({
      status: 400,
      message: `id ${id} does not match orderId ${orderId}`,
    });
  }
  
  if(dishes.length <= 0 || !Array.isArray(dishes)){
    return next({
      status: 400,
      message: `dishes cannot be empty`,
    });
  }
  
  const index = dishes.findIndex((dish, index) => {
    return dish.quantity === undefined || !Number.isInteger(dish.quantity) || dish.quantity <= 0;
  });
  
  if (dishes.some((dish) => dish.quantity === undefined || dish.quantity === 0 || !Number.isInteger(dish.quantity))) {
    return next({
      status: 400,
      message: `Dish ${index} must have a quantity that is an integer greater than 0`,
    });
  }
  
  const validStatusValues = ["pending", "in-progress", "completed", "cancelled"];

  if (!validStatusValues.includes(status)) {
    return next({
      status: 400,
      message: `Invalid status: ${status}`,
    });
  }

  foundOrder.deliverTo = deliverTo;
  foundOrder.mobileNumber = mobileNumber;
  foundOrder.status = status;
  foundOrder.dishes = dishes;

  res.json({ data: foundOrder });
}


//=========================================

function destroy(req, res, next) {
  const currentOrder = req.foundOrder;

  if (currentOrder.status !== 'pending') {
    return res.status(400).json({ error: 'Order status is not "pending".' });
  }

  const index = orders.indexOf(currentOrder);

  if (index !== -1) {
    orders.splice(index, 1);
    res.sendStatus(204);
  } else {
    res.status(405).json({ errors: 'DELETE' });
  }
}

//=========================================

function list(req, res) {
  res.json({ data: orders });
}

//=========================================

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);

  if (foundOrder) {
    req.foundOrder = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `order does not exist: ${orderId}`,
  });
}

//=========================================

function hasProperty(propertyName) {
  return (req, res, next) => {
    const { data } = req.body;

    if (!data || !data[propertyName]) {
      return next({
        status: 400,
        message: `Please insert ${propertyName}`,
      });
    }

    if (propertyName === "price") {
      const price = parseFloat(data.price);

      if (isNaN(price) || typeof data.price !== "number" || price < 0) {
        return next({
          status: 400,
          message: "price must be a valid number",
        });
      }
    }
    next();
  };
}

//=========================================

module.exports = {
  create: [
    hasProperty("deliverTo"),
    hasProperty("mobileNumber"),
    hasProperty("dishes"),
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    hasProperty("deliverTo"),
    hasProperty("mobileNumber"),
    hasProperty("dishes"),
    hasProperty("status"),
    update
  ],
  delete: [
    orderExists,
    destroy
  ],
  list,
};
