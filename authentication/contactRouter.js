const express = require("express");
const router = express.Router();
const contact = require("../database/contactSchema");

router.get("/contact", async (req, res) => {
  try {
    const response = req.body;
    await contact.create(response);
    return res.status(200).json({ message: "Message sent successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Message not sent" });
  }
});

module.exports = router;
