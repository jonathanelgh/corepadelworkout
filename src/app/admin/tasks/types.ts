export type AssigneeOption = {
  id: string;
  label: string;
  email: string | null;
};

export type TaskCardData = {
  id: string;
  columnId: string;
  title: string;
  description: string;
  dueDate: string | null;
  sortOrder: number;
  completed: boolean;
  assigneeIds: string[];
};

export type TaskColumnData = {
  id: string;
  name: string;
  sortOrder: number;
  cards: TaskCardData[];
};

export type TaskBoardListItem = {
  id: string;
  title: string;
  description: string | null;
  updatedAt: string;
  cardCount: number;
};

export type TaskBoardDetail = {
  id: string;
  title: string;
  description: string | null;
  columns: TaskColumnData[];
};
