import express from "express";
const router = express.router();

router.post("/logout", (req, res) => {
    res.status(200).json({ message: "Logged out"});
});

export default router;