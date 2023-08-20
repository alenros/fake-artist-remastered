import { writable } from "svelte/store";
import type { DrawEventModel } from "../models/draw-event-model";

export const playerDrawings = writable<DrawEventModel>(undefined);

export function updateDrawing(drawing: DrawEventModel) {
    playerDrawings.update(() => drawing);
}