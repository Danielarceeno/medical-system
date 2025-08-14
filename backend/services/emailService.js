const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendVerificationCode = async (to, code) => {
  const mailOptions = {
    from: `"Busca de Clínicas" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Seu Código de Verificação",
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; color: #333;">
        <h2>Verificação de Acesso</h2>
        <p>Olá! Use o código abaixo para fazer login no sistema de administração.</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 5px; background-color: #f0f0f0; padding: 10px 20px; border-radius: 5px; display: inline-block;">
          ${code}
        </p>
        <p>Este código é válido por 10 minutos.</p>
        <p style="font-size: 12px; color: #888;">Se você não solicitou este código, por favor, ignore este email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Código de verificação enviado para:", to);
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    throw new Error("Falha ao enviar email de verificação.");
  }
};