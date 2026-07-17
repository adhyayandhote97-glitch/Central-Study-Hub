export interface Topic {
  slug: string;
  name: string;
  order: number;
}

export interface Subject {
  id: string;
  name: string;
  slug: string;
  order: number;
  icon: string;
  color: string;
  topics: Topic[];
  createdAt: string;
  updatedAt: string;
}

export type SubjectInput = Pick<Subject, "name" | "icon" | "color"> & {
  order?: number;
};
