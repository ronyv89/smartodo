// AI provider interface — implemented in Phase 4
import type { Label } from '@smartodo/core';

export interface ParsedTask {
  title: string;
  due_date?: string;
  priority?: string;
  assignee?: string;
  labels?: string[];
}

export interface AIProvider {
  parseTaskInput(text: string): Promise<ParsedTask>;
  suggestLabels(taskTitle: string, existingLabels: Label[]): Promise<Label[]>;
  calculateFocusScore(taskId: string): Promise<number>;
  summarize(text: string): Promise<string>;
}
