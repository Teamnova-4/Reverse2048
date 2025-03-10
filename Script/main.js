import { Cell } from "./Tile.js";
import { CurrentGameState, clickSkill } from "./Board.js";
import { setCurrentState, explodeTile, DrawBoard } from "./Board.js";
import { playerHP, setGiveUpTurnCount, setHP, setSequence, setReduceMergeDamage, setisMergeRestrictedUntil } from "./Board.js";
import { playerSkillCoolTime } from "./Board.js";
import { playSound } from "./Sound.js";

window.clickSkill = clickSkill;

export { Cell };
export { CurrentGameState};
export { playerSkillCoolTime };
export { setCurrentState, explodeTile, DrawBoard, playSound };
export { playerHP, setGiveUpTurnCount, setHP, setSequence, setReduceMergeDamage, setisMergeRestrictedUntil };

setCurrentState("Start");