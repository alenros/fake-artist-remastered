export interface DrawEventModel { type: "start", x: number, y: number, room: string, color: string }

export type DrawEventType = "start" | "move";