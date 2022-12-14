import { ApiProperty } from '@nestjs/swagger';
import { GameMode } from '../../game/constants/game.mode.enum';

export class UserRecordDto {
  @ApiProperty({
    example: 'cfd32f23-a534-4122-8582-caba2c710a6c',
    description: '게임 기록의 id',
  })
  id: string;

  @ApiProperty({
    example: 74847,
    description: '이긴 유저의 id',
  })
  winUserId: string;

  @ApiProperty({
    example: 'dcho',
    description: '이긴 유저의 닉네임',
  })
  winUserNickname: string;

  @ApiProperty({
    example: 'files/profileImg/default.jpg',
    description: '이긴 유저의 프로필 이미지',
  })
  winUserProfileImg: string;

  @ApiProperty({
    example: 3,
    description: '이긴 유저의 점수',
  })
  winUserScore: number;

  @ApiProperty({
    example: 74873,
    description: '진 유저의 id',
  })
  loseUserId: string;

  @ApiProperty({
    example: 'jiholee',
    description: '진 유저의 닉네임',
  })
  loseUserNickname: string;

  @ApiProperty({
    example: 'files/profileImg/default.jpg',
    description: '진 유저의 프로필 이미지',
  })
  loseUserProfileImg: string;

  @ApiProperty({
    example: 1,
    description: '진 유저의 점수',
  })
  loseUserScore: number;

  @ApiProperty({
    example: true,
    description: '래더 게임 여부',
  })
  isLadder: boolean;

  @ApiProperty({
    example: GameMode.CLASSIC,
    description: '게임 모드',
  })
  type: GameMode;

  @ApiProperty({
    example: '2020-01-01',
    description: '게임 시작 시간',
  })
  createAt: Date;

  @ApiProperty({
    example: '2020-01-01',
    description: '게임 종료 시간',
  })
  updateAt: Date;
}
