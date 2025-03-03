import { Cell } from "./Tile.js";
import { CurrentGameState, clickSkill } from "./Board.js";
import { setCurrentState, explodeTile, DrawBoard } from "./Board.js";
import { playSound } from "./Sound.js";

window.clickSkill = clickSkill;

export { Cell };
export { CurrentGameState};
export { setCurrentState, explodeTile, DrawBoard, playSound };

setCurrentState("Start");