// backend/src/routes/auth.routes.js
import express from "express";
const router = express.Router();

router.post("/logout", (req, res) => {
    res.status(200).json({ message: "Logged out" });
});

export default router;