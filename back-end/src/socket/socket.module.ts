import { forwardRef, Module } from '@nestjs/common';
import { AlertRepository } from 'src/alert/alert.Repository';
import { AlertService } from 'src/alert/alert.service';
import { ChatModule } from 'src/chat/chat.module';
import { ChatRoomRepository } from 'src/chat/chat.room.repository';
import { ChatService } from 'src/chat/chat.service';
import { ChatUserRepository } from 'src/chat/chat.user.repository';
import { TypeOrmExModule } from 'src/custom/typeorm.module';
import { FriendRepository } from 'src/friend/friend.repository';
import { FriendService } from 'src/friend/friend.service';
import { GameRepository } from 'src/game/game.repository';
import { GameService } from 'src/game/game.service';
import { UserRepository } from 'src/users/users.repository';
import { UsersService } from 'src/users/users.service';
import { SocketGameService } from './game/socket-game.service';
import { SocketStateService } from './socket-state.service';
import { SocketStorageService } from './socket-storage.service';
import { SocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([UserRepository]),
    TypeOrmExModule.forCustomRepository([GameRepository]),
    TypeOrmExModule.forCustomRepository([ChatRoomRepository]),
    TypeOrmExModule.forCustomRepository([ChatUserRepository]),
    TypeOrmExModule.forCustomRepository([FriendRepository]),
    TypeOrmExModule.forCustomRepository([AlertRepository]),
    forwardRef(() => ChatModule),
  ],
  controllers: [],
  providers: [
    SocketGateway,
    SocketService,
    SocketGameService,
    SocketStateService,
    SocketStorageService,
    UsersService,
    GameService,
    FriendService,
    AlertService,
    ChatService,
  ],
  exports: [SocketGateway, SocketStateService, SocketService],
})
export class SocketModule {}
