function errorHandler(err, req, res, next) {
    console.error(err.stack);
    let statusCode = 500;
    if (err.name === 'ValidationError') {
      statusCode = 400;
    } else if (err.name === 'CastError' && err.kind === 'ObjectId') {
      statusCode = 404;
    }
    res.status(statusCode).json({ message: err.message });
  }
  
module.exports = errorHandler;