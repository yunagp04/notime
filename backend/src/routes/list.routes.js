// backend/src/routes/list.routes.js
import express from "express";
import { listController } from "../controllers/list.controller.js";

const router = express.Router();

router.get("/", listController.getMyLists);
router.post("/", listController.create);
router.get("/:listId", listController.getDetail);
router.post("/:listId/add-word", listController.addWord);
router.post("/:listId/bulk-delete", listController.bulkDelete);

router.put("/:listId", listController.updateList);
router.delete("/:listId", listController.deleteList);

export default router;