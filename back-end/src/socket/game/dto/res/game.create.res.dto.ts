import { GameMode } from 'src/game/constants/game.mode.enum';
import BaseResultDto from '../base.result.dto';

export default interface GameCreateResDto extends BaseResultDto {
  gameMode: GameMode;
  ladder: boolean;
  scoreForWin: number;
  myIndex: number;
}
