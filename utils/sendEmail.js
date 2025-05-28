import nodeMailer from "nodemailer";
export const sendEmail=async({email,subject,message})=>{
    const transporter=nodeMailer.createTransport({
        host:process.env.SMTP_HOST,
        port:process.env.SMTP_PORT,
        service:process.env.SMTP_SERVICE,
        secure: true, // true for port 465, false for port 587
        auth:{
            user:process.env.SMTP_MAIL,
            pass:process.env.SMTP_PASSWORD
        }
    });
    const options={
        from:process.env.SMTP_MAIL,
        to:email,
        subject:subject,
        text:message
    }
    try {
        const info = await transporter.sendMail(options);
        console.log("Email sent: ", info.response);
      } catch (error) {
        console.error("Error sending email:", error);
      }
    
}
