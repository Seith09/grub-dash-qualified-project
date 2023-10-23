const path = require("path");
// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));
// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");
// TODO: Implement the /dishes handlers needed to make the tests pass

//============================================

function create(req, res) {
  const { data: { name, description, price, image } = {} } = req.body;

  const newDish = {
    id: nextId(),
    name: name,
    description: description,
    price: price,
    image: image,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

//============================================

function read(req, res) {
  res.json({ data: req.foundDish });
}

//============================================

function update(req, res, next) {
  const { dishId } = req.params;
  const { data: { id, name, description, price, image_url } } = req.body;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  
  if (id !== undefined && id !== dishId && id !== null && id !== '') {
    return next({
      status: 400,
      message: `id ${id} does not match dishId ${dishId}`,
    });
  }

  foundDish.name = name;
  foundDish.description = description;
  foundDish.price = price;
  foundDish.image_url = image_url;
  res.json({ data: foundDish });
}


//============================================

function destroy(req, res) {
  const currentDish = req.foundDish;
  const index = dishes.indexOf(currentDish);

  if (index !== 1) {
    dishes.splice(index, 1);
    res.sendStatus(204);
  } else {
    res.status(405).json({ errors: `DELETE` });
  }
}

//============================================

function list(req, res) {
  res.json({ data: dishes });
}

//============================================

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);

  if (foundDish) {
    req.foundDish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}`,
  });
}

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

      if (isNaN(price) || typeof data.price !== 'number' || price < 0) {
        return next({
          status: 400,
          message: "price must be a valid number",
        });
      }
    }

    next();
  };
}

//============================================

module.exports = {
  create: [
    hasProperty("name"),
    hasProperty("description"),
    hasProperty("price"),
    hasProperty("image_url"),
    create,
  ],
  read: [dishExists, read],
  update: [
    dishExists,
    hasProperty("name"),
    hasProperty("description"),
    hasProperty("price"),
    hasProperty("image_url"),
    update],
  delete: [dishExists, destroy],
  list,
};
