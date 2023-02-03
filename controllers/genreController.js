const Genre = require("../models/genre");
const Book = require("../models/book");
// const mongoose = require("mongoose");

const async = require("async");
const { body, validationResult } = require("express-validator");


// Display list of all Genres
exports.genre_list = (req, res, next) => {
 Genre.find()
  .sort([["name", "ascending"]])
  .exec(function (err, list_genres) {
   if (err) {
    return next(err);
   }
   // Successful
   res.json(list_genres);
  });
};

// Display detail page for a specific genre
exports.genre_detail = (req, res, next) => {
 async.parallel(
  {
   genre(callback) {
    Genre.findById(req.params.id).exec(callback);
   },
   genre_books(callback) {
    Book.find({ genre: req.params.id }).exec(callback);
   },
  },
  (err, results) => {
   if (err) {
    return next(err);
   }
   if (results.genre == null) {
    // No results
    const err = new Error("Genre not found");
    err.status = 404;
    return next(err);
   }
   res.json(results);
  }
 );
};

// Handle Genre create on POST
exports.genre_create_post = [
  // Validate and sanitize the name field
  body("name", "genre name required").trim().isLength({ min: 1 }).escape(),

  // Process request after validation and sanitization
  async (req, res, next) => {
    // Extract the validation errors from a request
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages
      res.status(400).json(errors.array());
      return;
    } else {
      // Data from form is valid

      // Create a genre object with escaped and trimmed data
      const genre = await new Genre({ name: req.body.name });

      // Check if Genre with same name already exists
      Genre.findOne({ name: req.body.name }).exec((err, found_genre) => {
        if (err) {
          return next(err);
        }

        if (found_genre) {
          // Genre exists, redirect to its detail page
          res.status(400).json(found_genre);
        } else {
          genre.save((err) => {
            if (err) {
              return next(err);
            }
            res.status(201).json(genre);
          });
        }
      });
    }
  },
// };
];

// Display Genre delete form on GET
exports.genre_delete_get = (req, res, next) => {
  async.parallel(
    {
      genre(callback) {
        Genre.findById(req.params.id).exec(callback);
      },
      genres_books(callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        // No results
        res.status(404).json(res);
      }
      // Successful
      res.json(results);
    }
  );
};

// Handle Genre delete on POST
exports.genre_delete_post = (req, res, next) => {
//  res.send("NOT IMPLEMENTED: Genre delete POST");
  async.parallel(
    {
      genre(callback) {
        Genre.findById(req.body.genreid).exec(callback);
      },
      genres_books(callback) {
        Book.find({ genre: req.body.genreid }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      // No errors
      if (results.genres_books.length > 0) {
        results["message"] = "Genre has books. You must delete these books before you may delete genre.";
        res.status(401).json(results);
        return;
      }
      // Genre has no books. Delete object and redirect to the list of genres
      Genre.findByIdAndRemove(req.body.genreid, (err) => {
        if (err) {
          return next(err);
        }
        res.json(results.genre);
      });
    }
  );
};

// Display Genre update form on GET
exports.genre_update_get = (req, res, next) => {
  // Get genre for form
  async.parallel(
    {
      genre(callback) {
        Genre.findById(req.params.id).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        // No results
        res.status(404).json({ 'message': 'Genre not found' });
      }
      res.json(results);
    }
  );
};

// Handle Genre update on POST
exports.genre_update_post = [
//  res.send("NOT IMPLEMENTED: Genre update POST");
  body("name", "genre name required").trim().isLength({ min: 1 }).escape(),

  // Process request after validation and sanitization
  async (req, res, next) => {
    // Extract the validation errors from a request
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/errors messages.
      res.status(400).json(errors.array());
      return;
    } else {
      // Create a Genre object with escaped/trimmed data and old id
      const genre = await new Genre({
        name: req.body.name,
        _id: req.params.id //This is required, or a new ID will be assigned!
      })

      // Data from form is valid. Update the record.
      Genre.findByIdAndUpdate(req.params.id, genre, {}, (err, thegenre) => {
        if (err) {
          return next(err);
        }
        res.status(201).json(genre);
      });
    }
    
  }
];
