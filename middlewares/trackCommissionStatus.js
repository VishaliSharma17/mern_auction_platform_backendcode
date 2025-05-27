import { User } from "../models/userSchema.js";
import { catchAsyncErrors } from "./catchAsyncError.js";
import ErrorHandler from "./error.js";

export const trackCommissionStatus = catchAsyncErrors(
  async (req, res, next) => {
    const user = await User.findById(req.user._id);
    if (user.unpaidCommission > 0) {
      return next(
        new ErrorHandler(
          "You have unpaid commisions.Please pay them before posting a new auction.",
          403
        )
      );
    }
    next();
  }
);
