import { ApiProperty } from '@nestjs/swagger';

export class BlockListDto {
  @ApiProperty({
    description: '차단한 사람의 아이디',
  })
  id: string;

  @ApiProperty({
    description: '차단한 사람의 닉네임',
  })
  nickname: string;
}
