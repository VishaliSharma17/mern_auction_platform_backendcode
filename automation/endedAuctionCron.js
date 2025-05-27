import cron from "node-cron";
import { Auction } from "../models/auctionSchema.js";
import { calculateCommission } from "../controllers/commissionController.js";
import { Bid } from "../models/bidSchema.js";
import {sendEmail} from "../utils/sendEmail.js";
import { User } from "../models/userSchema.js";


export const endedAuctionCron = () => {
  cron.schedule("*/1 * * * *", async () => {
    //min hrs day month yr
    // console.log("Cron job triggered at", new Date());
    const now = new Date();
    const endedAuctions = await Auction.find({
      endTime: { $lt: now },
      commissionCalculated: false,
    });
    // console.log("Ended auctions:", endedAuctions);
    for (const auction of endedAuctions) {
      try {
        const commissionAmount = await calculateCommission(auction._id);
        auction.commissionCalculated = true;
        const highestBidder = await Bid.findOne({
          auctionItem: auction._id,
          amount: auction.currentBid,
        });
        const auctioneer = await User.findById(auction.createdBy);
        auctioneer.unpaidCommission = commissionAmount;
        if (highestBidder) {
          auction.highestBidder = highestBidder.bidder.id;
          await auction.save();
          const bidder = await User.findById(highestBidder.bidder.id);
          await User.findByIdAndUpdate(
            bidder._id,
            {
              $inc: {
                moneySpent: highestBidder.amount,
                auctionsWon: 1,
              },
            },
            { new: true }
          );
          await User.findByIdAndUpdate(
            auctioneer._id,
            {
              $inc: {
                unpaidCommission: commissionAmount,
              },
            },
            { new: true }
          );
          const subject = `Congratulations! You won the auction for ${auction.title}`;
          const message = `Dear ${bidder.userName}, \n\nCongratulations! You have won the auction for ${auction.title}. \n\nBefore proceeding for payment contact your auctioneer via your auctioneer email:${auctioneer.email} \n\nPlease complete your payment using one of the following methods:\n\n1. **Bank Transfer**: \n- Account Name: ${auctioneer.paymentMethods.bankTransfer.bankAccountName} \n- Account Number: ${auctioneer.paymentMethods.bankTransfer.bankAccountNumber} \n- Bank: ${auctioneer.paymentMethods.bankTransfer.bankName}\n\n2. **GooglePay**:\n- You can send payment via GooglePay: ${auctioneer.paymentMethods.googlepay.googlepayNumber}\n\n3. **PHonePay**:\n- Send payment to: ${auctioneer.paymentMethods.phonepay.phonepayId}\n\n4. **Cash on Delivery (COD)**:\n- If you prefer COD, you must pay 20% of the total amount upfront before delivery.\n- To pay the 20% upfront, use any of the above methods.\n- The remaining 80% will be paid upon delivery.\n- If you want to see the condition of your auction item then send your email on this: ${auctioneer.email}\n\nPlease ensure your payment is completed by [Payment Due Date]. Once we confirm the payment, the item will be shipped to you.\n\nThank you for participating!\n\nBest regards,\nPanda Auction Team`;
          console.log("SENDING EMAIL TO HIGHEST BIDDER");
          sendEmail({ email: bidder.email, subject, message });
          console.log("SUCCESSFULLY EMAIL SEND TO HIGHEST BIDDER");
        } else {
          await auction.save();
        }
      } catch (error) {
        return next(console.error(error||"Some error in ended auction cron"));
      }
    }
  });
};
// import cron from "node-cron";
// import { sendEmail } from "../utils/sendEmail.js";

// export const endedAuctionCron = () => {
//   cron.schedule("*/1 * * * *", async () => {
//     try {
//       await sendEmail({
//         email: "vishalisharma964@gmail.com",
//         subject: "Test Email",
//         message: "This is a test email sent using Nodemailer.",
//       });
//       console.log("Email sent successfully.");
//     } catch (error) {
//       console.error("Error sending email:", error);
//     }
//   });
// };
