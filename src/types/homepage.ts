export type DailyFactType = "fact" | "quote" | "tip";

export interface DailyFact {
  id: string;
  type: DailyFactType;
  text: string;
  author: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DailyFactInput {
  type: DailyFactType;
  text: string;
  author?: string | null;
  active?: boolean;
}

export type StudyTipCategory =
  | "revision"
  | "exam-strategy"
  | "productivity"
  | "study-method";

export interface StudyTip {
  id: string;
  title: string;
  body: string;
  category: StudyTipCategory;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudyTipInput {
  title: string;
  body: string;
  category: StudyTipCategory;
  order?: number;
  active?: boolean;
}
