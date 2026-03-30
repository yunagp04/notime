import { Request, Response } from "express";
import { IListRepository } from "../interfaces/IListRepository";

export class ListController {
  constructor(private repo: IListRepository) {}

  async getLists(req: any, res: Response) {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const lists = await this.repo.getLists(userId);
      return res.status(200).json(lists);
    } catch (err) {
      return res.status(500).json({ error: "ดึง list ไม่สำเร็จ" });
    }
  }
}