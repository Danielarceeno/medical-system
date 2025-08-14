require("dotenv").config();
const express = require("express");
const cors = require("cors");
const clinicasRoutes = require("./controllers/clinicasController");
const authRoutes = require("./controllers/authController");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api", clinicasRoutes);
app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});