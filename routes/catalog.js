const express = require("express");
const router = express.Router();

// Require controller modules
const book_controller = require("../controllers/bookController");
const author_controller = require("../controllers/authorController");
const genre_controller = require("../controllers/genreController");
const book_instance_controller = require("../controllers/bookinstanceController");

/// BOOK ROUTES ///

router.get("/", book_controller.index);

router.post("/book/create", book_controller.book_create_post);

router.route("/book/:id/delete")
    .get(book_controller.book_delete_get)
    .post(book_controller.book_delete_post);

router.route("/book/:id/update")
    .get(book_controller.book_update_get)
    .post(book_controller.book_update_post);

router.get("/book/:id", book_controller.book_detail);

router.get("/books", book_controller.book_list);


/// AUTHOR ROUTES ///

router.post("/author/create", author_controller.author_create_post)

router.route("/author/:id/delete")
    .get(author_controller.author_delete_get)
    .post(author_controller.author_delete_post)

router.route("/author/:id/update")
    .get(author_controller.author_update_get)
    .post(author_controller.author_update_post)

router.get("/author/:id", author_controller.author_detail);

router.get("/authors", author_controller.author_list);


/// GENRE ROUTES ///

router.post("/genre/create", genre_controller.genre_create_post)

router.route("/genre/:id/delete")
    .get(genre_controller.genre_delete_get)
    .post(genre_controller.genre_delete_post)

router.route("/genre/:id/update")
    .get(genre_controller.genre_update_get)
    .post(genre_controller.genre_update_post)

router.get("/genre/:id", genre_controller.genre_detail);

router.get("/genres", genre_controller.genre_list);


/// BOOKINSTANCE ROUTES ///

router.post("/bookinstance/create", book_instance_controller.bookinstance_create_post)

router.route("/bookinstance/:id/delete")
    .get(book_instance_controller.bookinstance_delete_get)
    .post(book_instance_controller.bookinstance_delete_post)

router.route("/bookinstance/:id/update")
    .get(book_instance_controller.bookinstance_update_get)
    .post(book_instance_controller.bookinstance_update_post)

router.get("/bookinstance/:id", book_instance_controller.bookinstance_detail);

router.get("/bookinstances", book_instance_controller.bookinstance_list);


module.exports = router;