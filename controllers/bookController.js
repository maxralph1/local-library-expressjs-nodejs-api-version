const Book = require("../models/book");
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");

const async = require("async");
const { body, validationResult } = require("express-validator");

exports.index = (req, res) => {
 async.parallel(
  {
   book_count(callback) {
    Book.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
   },
   book_instance_count(callback) {
    BookInstance.countDocuments({}, callback);
   },
   book_instance_available_count(callback) {
    BookInstance.countDocuments({ status: "Available" }, callback);
   },
   author_count(callback) {
    Author.countDocuments({}, callback);
   },
   genre_count(callback) {
    Genre.countDocuments({}, callback);
   },
  },
  (err, results) => {
   if (err) {
     return next(err);
   }

   // Successful
   res.json(results)
  }
 );
};

// Display list of all books
exports.book_list = async (req, res, next) => {
 await Book.find({}, "title author")
  .sort({ title: 1})
  .populate("author")
  .exec(function (err, list_books) {
   if (err) {
    return next(err);
   }
   // Successful
   res.json(list_books);
  });
};

// Display detail page for a specific book
exports.book_detail = (req, res, next) => {
 // res.send(`NOT IMPLEMENTED: Book detail: ${req.params.id}`);
 async.parallel(
  {
   book(callback) {
    Book.findById(req.params.id)
     .populate("author")
     .populate("genre")
     .exec(callback);
   },
   book_instance(callback) {
    BookInstance.find({ book: req.params.id }).exec(callback);
   },
  },
  (err, results) => {
   if (err) {
    // Error in API usage
    return next(err);
   }
   if (results.book == null) {
    // No results
    const err = new Error("Book not found");
    err.status = 404;
    return next(err);
   }
   // Successful
   res.json(results.book);
  }
 );
};

// Handle book create on POST
exports.book_create_post = [
  // Convert the genre to an array
  (req, res, next) => {
    if (!Array.isArray(req.body.genre)) {
      req.body.genre = typeof req.body.genre === "undefined" ? [] : [req.body.genre];
    }
    next();
  },

  // Validate and sanitize fields
  body("title", "Title must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("author", "Author must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("summary", "Summary must not be empty")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
  body("genre.*").escape(),

  // Process request after validation and sanitization
  (req, res, next) => {
    // Extract the validation errors from a request
    const errors = validationResult(req);

    // Create a Book object with escaped and trimmed data
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error message

      // Get all authors and genres for form
      async.parallel(
        {
          authors(callback) {
            Author.find(callback);
          },
          genres(callback) {
            Genre.find(callback);
          },
        },
        (err, results) => {
          if (err) {
            return next(err);
          }

          // Mark our selected genres as checked
          for (const genre of results.genres) {
            if (book.genre.includes(genre._id)) {
              genre.checked = "true";
            }
          }
          results["errors"] = error.array();

          res.status(400).json(results);
        }
      );
      return;
    }

    // Data from form is valid. Save book.
    book.save((err) => {
      if (err) {
        return next(err);
      }
      res.status(201).json(book);
    });
  },
];

// Display book delete form on GET
exports.book_delete_get = (req, res, next) => {
  async.parallel(
    {
      book(callback) {
        Book.findById(req.params.id).exec(callback);
      },
      books_bookinstances(callback) {
        BookInstance.find({ book: req.params.id }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.book == null) {
        // No results
        res.status(404).json({ 'message': 'Book not found' });
      }
      // Successful
      res.json(results);
    }
  );
};

// Handle book delete on POST
exports.book_delete_post = (req, res, next) => {
  async.parallel(
    {
      book(callback) {
        Book.findById(req.body.bookid).exec(callback);
      },
      books_bookinstances(callback) {
        BookInstance.find({ book: req.body.bookid }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      // Success
      if (results.books_bookinstances.length > 0) {
        results["message"] = "Book has bookinstances. You must delete these bookinstances before you may delete book.";
        res.status(401).json(results);
        return;
      }
      // Book has no bookinstances. Delete book.
      Book.findByIdAndRemove(req.body.bookid, (err) => {
        if (err) {
          return next(err);
        }
        // Success
        res.json(results.book);
      });
    }
  );
};

// Display book update form on GET
exports.book_update_get = (req, res, next) => {
  // Get book, author and genre(s) for form
  async.parallel(
    {
      book(callback) {
        // we could have also chained orFail() method here to avoid checking it against "null" as we have done down below
        // Book.findById(req.params.id).orFail()
        // Book.findById(req.params.id).orFail(new Error('Book not found!'))
        // Book.findById(req.params.id).orFail(() => Error('Book not found'))
        Book.findById(req.params.id)
          .populate("author")
          .populate("genre")
          .exec(callback);
      },
      authors(callback) {
        Author.find(callback);
      },
      genres(callback) {
        Genre.find(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.book == null) {
        // No results
        const err = new Error("Book not found");
        err.status = 404;
        return next(err);
      }
      // Success
      // Marks our selected genres as checked
      for (const genre of results.genres) {
        for (const bookGenren of results.book.genre) {
          if (genre._id.toString() === bookGenren._id.toString()) {
            genre.checked = "true";
          }
        }
      }
      res.json(results);
    }
  );
};

// Handle book update on POST
exports.book_update_post = [
  // Convert the genre to an array
  (req, res, next) => {
    if (!Array.isArray(req.body.genre)) {
      req.body.genre = typeof req.body.genre === "undefined" ? [] : [req.body.genre];
    }
    next();
  },

  // Validate and sanitize fields
  body("title", "Title must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("author", "Author must not be empty.")
    .trim()
    .isLength()
    .escape(),
  body("summary", "Summary must not be empty.")
    .trim()
    .isLength()
    .escape(),
  body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
  body("genre.*").escape(),

  // Process request after validation and sanitization
  (req, res, next) => {
    // Extract the validation errors from a request
    const errors = validationResult(req);

    // Create a Book object with escaped/trimmed data and old id
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: typeof req.body.genre == "undefined" ? [] : req.body.genre,
      _id: req.params.id //This is required, or a new ID will be assigned!
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages

      // Get all authors and genres for form
      async.parallel(
        {
          authors(callback) {
            Author.find(callback);
          },
          genres(callback) {
            Genre.find(callback);
          },
        },
        (err, results) => {
          if (err) {
            return next(err);
          }

          // Mark our slected genres as checked
          for (const genre of results.genres) {
            if (book.genre.includes(genre._id)) {
              genre.checked = "true";
            }
          }
          results["errors"] = error.array();
          
          res.status(400).json(results);
        }
      );
      return;
    }

    // Data from form is valid. Update the record.
    Book.findByIdAndUpdate(req.params.id, book, {}, (err, thebook) => {
      if (err) {
        return next(err);
      }
      res.status(201).json(book);
    });
  }
];