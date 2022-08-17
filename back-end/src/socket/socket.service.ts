import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Server } from 'http';
import { ChatRoomRepository } from 'src/chat/chat.room.repository';
import { ChatUserRepository } from 'src/chat/chat.user.repository';
import { ChatJoinNotifyDto } from 'src/socket/chat/dto/chat.join.notify.dto';
import { ChatLeaveNotifyDto } from 'src/socket/chat/dto/chat.leave.notify.dto';
import { ChatMessageNotifyDto } from './chat/dto/chat.message.notify.dto';
import { ChatUpdateProtectionNotifyDto } from './chat/dto/chat.update.protection.notify.dto';
import { UserContext } from './class/user.class';
import { SocketEventName } from './game/constants/game.constants';

@Injectable()
export class SocketService {
  constructor(
    @InjectRepository(ChatRoomRepository)
    private readonly chatRoomRepository: ChatRoomRepository,
    @InjectRepository(ChatUserRepository)
    private readonly chatUserRepository: ChatUserRepository,
  ) {}

  handleJoinChatRoom(userInfo: UserContext): void {
    userInfo.socket.join(userInfo.chatRoom);
    userInfo.server
      .to(userInfo.chatRoom)
      .emit(SocketEventName.CHAT_JOIN_NOTIFY, <ChatJoinNotifyDto>{
        nickname: userInfo.user.nickname,
        profileImg: userInfo.user.profileImg,
        id: userInfo.user.id,
      });
  }

  handleLeaveChatRoom(userInfo: UserContext): void {
    userInfo.server
      .to(userInfo.chatRoom)
      .emit(SocketEventName.CHAT_LEAVE_NOTIFY, <ChatLeaveNotifyDto>{
        nickname: userInfo.user.nickname,
      });
    userInfo.socket.leave(userInfo.chatRoom);
    userInfo.chatRoom = null;
  }

  handleChatMessage(
    server,
    nickname: string,
    chatId: string,
    content: string,
  ): void {
    server.to(chatId).emit(SocketEventName.CHAT_MESSAGE_NOTIFY, <
      ChatMessageNotifyDto
    >{
      nickname,
      content,
    });
  }

  handleUpdateChatType(server, chatId: string, isChange: boolean) {
    server.to(chatId).emit(SocketEventName.CHAT_UPDATE_PROTECTION_NOTIFY, <
      ChatUpdateProtectionNotifyDto
    >{
      status: isChange,
    });
  }
}
