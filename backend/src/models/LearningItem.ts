export class LearningItem {
    constructor(
        public itemId: string,
        public word: string,
        public definition: string,
        public lastReviewed: Date | null = null,
        public nextReview: Date | null = null,
        public currentInterval: number = 0,
        public difficulty: number = 2.5,
        public isSelected: boolean = false
    ) {}
}