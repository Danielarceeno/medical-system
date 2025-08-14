const express = require("express");
const jwt = require("jsonwebtoken");
const { sendVerificationCode } = require("../services/emailService");
const router = express.Router();

const verificationCodes = new Map();

router.post("/request-code", async (req, res) => {
  const { email } = req.body;
  if (!email || !email.endsWith(`@${process.env.ALLOWED_EMAIL_DOMAIN}`)) {
    return res.status(400).json({ message: "Inválido ou não autorizado" });
  }

  try {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000;

    verificationCodes.set(email, { code, expires });
    await sendVerificationCode(email, code);

    res.status(200).json({ message: `Código de verificação enviado para ${email}.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Falha ao enviar código de verificação." });
  }
});

router.post("/verify-code", (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ message: "Email e código são obrigatórios." });
  }

  const stored = verificationCodes.get(email);

  if (!stored || stored.code !== code) {
    return res.status(400).json({ message: "Código de verificação inválido." });
  }

  if (Date.now() > stored.expires) {
    verificationCodes.delete(email);
    return res.status(400).json({ message: "Código de verificação expirado." });
  }

  const token = jwt.sign(
    { email: email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  verificationCodes.delete(email);

  res.status(200).json({ token });
});

module.exports = router;