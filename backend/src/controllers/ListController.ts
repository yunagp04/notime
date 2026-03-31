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
    async create(req: any, res: Response) {
        const { name } = req.body;
        const userId = req.userId;
        if (!name) return res.status(400).json({ error: "กรุณาระบุชื่อลิสต์" });

        try {
            const listId = await this.repo.createList(userId, name);
            return res.status(201).json({ success: true, listId });
        } catch (err: any) {
            return res.status(500).json({ error: "สร้างลิสต์ล้มเหลว", details: err.message });
        }
    }

    async update(req: any, res: Response) {
        const { id } = req.params;
        const { name } = req.body;
        const userId = req.userId;
        try {
            await this.repo.updateList(userId, id, name);
          return res.status(200).json({ message: "แก้ไขชื่อลิสต์สำเร็จ" });
        } catch (err) {
            return res.status(500).json({ error: "แก้ไขลิสต์ล้มเหลว" });
        }
    }

    async delete(req: any, res: Response) {
        const { id } = req.params;
        const userId = req.userId;
        try {
            await this.repo.deleteList(userId, id);
            return res.status(200).json({ message: "ลบลิสต์สำเร็จ" });
        } catch (err) {
            return res.status(500).json({ error: "ลบลิสต์ล้มเหลว" });
        }
    }
}