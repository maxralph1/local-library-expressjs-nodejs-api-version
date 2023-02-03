const Author = require("../models/author");
const Book = require("../models/book");

const async = require("async");
const { body, validationResult } = require("express-validator");


// Display list of all authors
exports.author_list = async (req, res, next) => {
  // const authors = await Author.find().sort([["family_name", "ascending"]]);
  // if (!authors) return res.status(204).json({ 'message': 'No authors found' });
  
  // // Successful
  // res.json(authors);
  Author.find()
    .sort([["family_name", "ascending"]])
    .exec(function (err, list_authors) {
      if (err) {
        return next(err);
      }
      // Successful
      res.json(list_authors);
    });
};

// Display detail page for a specific Author
exports.author_detail = (req, res, next) => {
 async.parallel(
  {
   author(callback) {
    Author.findById(req.params.id).exec(callback);
   },
   authors_books(callback) {
    Book.find({ author: req.params.id }, "title summary").exec(callback);
   },
  },
  (err, results) => {
   if (err) {
    // Error in API usage
    return next(err);
   }
   if (results.author == null) {
    // No results
    const err = new Error("Author not found");
    err.status = 404;
    return next(err);
   }
   res.json(results);
  }
 )
};

// Handle Author create on POST.
exports.author_create_post = [
  // Validate and sanitize fields.
  body("first_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("First name must be specified.")
    .isAlphanumeric()
    .withMessage("First name has non-alphanumeric characters."),
  body("family_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("Family name must be specified.")
    .isAlphanumeric()
    .withMessage("Family name has non-alphanumeric characters."),
  body("date_of_birth", "Invalid date of birth")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  body("date_of_death", "Invalid date of death")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  // Process request after validation and sanitization.
  async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/errors messages.
      res.status(400).json(errors.array());
      return;
    }
    // Data from form is valid.

    // Create an Author object with escaped and trimmed data.
    const author = await new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
    });
    author.save((err) => {
      if (err) {
        return next(err);
      }
      res.status(201).json(author);
    });
  },
];

// Display Author delete form on GET
exports.author_delete_get = (req, res, next) => {
  async.parallel(
    {
      author(callback) {
        Author.findById(req.params.id).exec(callback);
      },
      authors_books(callback) {
        Book.find({ author: req.params.id }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.author == null) {
        // No results
        res.status(404).json({ 'message': 'Author not found' });
      }
      // Successful
      res.json(results);
    }
  );
};

// Handle Author delete on POST
exports.author_delete_post = (req, res, next) => {
  async.parallel(
    {
      author(callback) {
        Author.findById(req.body.authorid).exec(callback);
      },
      authors_books(callback) {
        Book.find({ author: req.body.authorid }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      // No errors
      if (results.authors_books.length > 0) {
        results["message"] = "Author has books. You must delete these books before you may delete author.";
        res.status(401).json(results);
        return;
      }
      // Author has no books. Delete author.
      Author.findByIdAndRemove(req.body.authorid, (err) => {
        if (err) {
          return next(err);
        }
        res.json(results.author);
      });
    }
  );
};

// Display Author update form on GET
exports.author_update_get = (req, res, next) => {
  // Get author for form
  async.parallel(
    {
      author(callback) {
        Author.findById(req.params.id).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.author == null) {
        // No results
        res.status(404).json({ 'message': 'Author not found' });
      }
      res.json(results);
    }
  );
};

// Handle Author update on POST
exports.author_update_post = [
  // Validate and sanitize fields
  body("first_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("First name must be specified.")
    .isAlphanumeric()
    .withMessage("First name has non-alphanumeric characters."),
  body("family_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("Family name must be specified.")
    .isAlphanumeric()
    .withMessage("Family name has non-alphanumeric characters."),
  body("date_of_birth", "Invalid date of birth")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  body("date_of_death", "Invalid date of death")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
    // Process request after validation and sanitization
  async (req, res, next) => {
    // Extract the validation errors from a request
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/errors messages.
      res.status(400).json(errors.array());
      return;
    } else {
      // Create an Author object with escaped/trimmed data and old id
      const author = await new Author({
        first_name: req.body.first_name,
        family_name: req.body.family_name,
        date_of_birth: req.body.date_of_birth,
        date_of_death: req.body.date_of_death,
        _id: req.params.id // This is required, or a new ID will be assigned!
      });

      // Data from form is valid. Update the record.
      Author.findByIdAndUpdate(req.params.id, author, {}, (err, theauthor) => {
        if (err) {
          return next(err);
        }
        res.status(201).json(author);
      });
    }
  }
];