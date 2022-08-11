import { Injectable } from '@nestjs/common';
import { GameRepository } from './game.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { GameCreateDto } from './dto/game.create.dto';
import { UserDto } from 'src/users/dto/userdto';
import { GameRecord } from './entities/game.entity';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entities/user.entity';
import { GameMode } from './constants/game.mode.enum';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(GameRepository)
    private gameRepository: GameRepository,
    private userService: UsersService,
  ) {}

  // 유저 2명 모두 들어올 때, return gameId
  async createGame(
    leftUser: User,
    rightUser: User,
    gameMode: GameMode,
    ladder: boolean,
  ): Promise<string> {
    const findLeftUser = await this.userService.findByUser(leftUser);
    // 유저가 존재하지 않으면, null 반환하게 해야 하는데 그냥 임의로 찾아버림. friend에서는 되는데 여기서는 안됨.
    const findRightUser = await this.userService.findByUser(rightUser);
    return this.gameRepository.createGame(
      findLeftUser,
      findRightUser,
      gameMode,
      ladder,
    );
  }

  // 프로필에서 유저의 게임 전적 가져오기
  async getGamesByUserId(user: UserDto): Promise<GameRecord[]> {
    const query = this.gameRepository.createQueryBuilder('game');

    query
      .where('game.leftUserId = :userId', { userId: user.id })
      .orWhere('game.rightUserId = :userId', { userId: user.id });

    const boards = await query.getMany();
    return boards;
  }

  async updateGame(
    gameId: string,
    winUser: User,
    loseUser: User,
    winScore: number,
    loseScore: number,
    isLadder: boolean,
    type: GameMode,
  ): Promise<void> {
    await this.gameRepository.updateGame(
      gameId,
      winUser,
      loseUser,
      winScore,
      loseScore,
      isLadder,
      type,
    );
  }
}
