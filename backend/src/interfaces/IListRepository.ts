// 🚩 IListRepository.ts
export interface IListRepository {
    getLists(userId: string): Promise<{ list_id: string; name: string; vocab_count: number }[]>;
    createList(userId: string, name: string): Promise<string>;
    updateList(userId: string, listId: string, name: string): Promise<void>;
    deleteList(userId: string, listId: string): Promise<void>;
    
    createDefaultList(userId: string): Promise<void>;
    getOrCreateDefaultList(userId: string): Promise<string>;
}