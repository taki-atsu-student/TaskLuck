export interface ShiftRequestPayload {
  userId: number;
  date: string;
  startTime: string;
  endTime: string;
  note: string;
}

export type ShiftRequestErrors = Partial<{
  date: string;
  startTime: string;
  endTime: string;
  note: string;
}>;
