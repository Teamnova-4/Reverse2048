import { Tile, Value } from "./Tile.js";
import { CurrentGameState, clickSkill } from "./Board.js";
import { setCurrentState, explodeTile, DrawBoard } from "./Board.js";

window.clickSkill = clickSkill;

export { Tile, Value };
export { CurrentGameState};
export { setCurrentState, explodeTile, DrawBoard };

setCurrentState("Start");