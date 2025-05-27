import cron from "node-cron";
import { PaymentProof } from "../models/commissionProofSchema.js";
import { User } from "../models/userSchema.js";
import { sendEmail } from "../utils/sendEmail.js";
import { Commission } from "../models/commissionSchema.js";

export const verifyCommissionCron = () => {
  cron.schedule("*/1 * * * *", async () => {
    console.log("Running verify Commission Cron..");
    const approvedProofs = await PaymentProof.find({ status: "Approved" });
    for (const proof of approvedProofs) {
      try {
        const user = await User.findById(proof.userId);
        let updatedUserData = {};
        const formattedAmount = parseFloat(proof.amount.toFixed(2));
        if (user) {
          if (user.unpaidCommission >= formattedAmount ) {
            updatedUserData = await User.findByIdAndUpdate(
              user._id,
              {
                $inc: {
                  unpaidCommission: -formattedAmount ,
                },
              },
              { new: true }
            );
            await PaymentProof.findByIdAndUpdate(proof._id, {
              status: "Settled",
            });
           
          } else {
            updatedUserData = await User.findByIdAndUpdate(
              user._id,
              {
                unpaidCommission: 0,
              },
              { new: true }
            );
            await PaymentProof.findByIdAndUpdate(proof._id, {
              status: "Settled",
            });
          }
         
          await Commission.create({
            amount: formattedAmount ,
            user: user._id,
          });
          // const settlementDate = new Date(Date.now()).toString().substring(0, 15);
          const settlementDate = new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          const subject = `Your Payment Has Been Successfully Verified And Settled`;
          const message = `Dear ${user.userName},\n\nWe are pleased to inform you that your recent payment has been successfully verified and settled. Thank you for promptly providing the necessary proof of payment. Your account has been updated, and you can now proceed with your activities on our platform without any restrictions.\n\nPayment Details:\nAmount Settled: ${formattedAmount}\nUnpaid Amount: ${updatedUserData.unpaidCommission}\nDate of Settlement: ${settlementDate}\n\nBest regards,\nPanda Auction Team`;
          sendEmail({ email: user.email, subject, message });
        }
        console.log(`User ${proof.userId} paid commission of ${formattedAmount}`);
      } catch (error) {
        console.error(
          `Error processing commission proof for user ${proof.userId}: ${error.message}`
        );
      }
    }
  });
};
