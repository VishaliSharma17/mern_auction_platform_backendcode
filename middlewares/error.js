class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}
export const errorMiddleware = (error, req, res, next) => {
  error.message = error.message || "Internal Server Error.";
  error.statusCode = error.statusCode || 500;

  if (error.name === "jsonWebTokenError") {
    const message = "Json Web Token is invalid, Try again.";
    error = new ErrorHandler(message, 400);
  }
  if (error.name === "TokenExpiredError") {
    const message = "Json Web Token is expired, Try again.";
    error = new ErrorHandler(message, 400);
  }
  if (error.name === "CastError") {
    const message = `Invalid ${error.path}`;
    error = new ErrorHandler(message, 400);
  }

  const errorMessage = error.errors
    ? Object.values(error.errors)
        .map((error) => error.message)
        .join(" ")
    : error.message;

    return res.status(error.statusCode).json({
        success:false,
        message:error.message,
    });
};
export default ErrorHandler;