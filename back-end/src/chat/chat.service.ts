import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRoomRepository } from './chat.room.repository';
import { ChatRoom } from './entities/chat.room.entity';
import { CreateChatRoomDto } from './dto/create.chat.room.dto';
import { UpdateChatPasswordDto } from './dto/update.chat.password.dto';
import { ChatType } from './constants/chat.type.enum';
import { UsersService } from 'src/users/users.service';
import { ChatUserRepository } from './chat.user.repository';
import { ChatRole } from './constants/chat.role.enum';
import { UpdateRoleDto } from './dto/update.role.dto';
import { ChatRoomDto } from './dto/chat.room.dto';
import { ChatUser } from './entities/chat.user.entity';
import e from 'cors';
import { find } from 'rxjs';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoomRepository)
    private readonly chatRoomRepository: ChatRoomRepository,
    @InjectRepository(ChatUserRepository)
    private readonly chatUserRepository: ChatUserRepository,
    private readonly userService: UsersService,
  ) {}

  async createChatRoom(chatRoomDto: CreateChatRoomDto): Promise<string> {
    const user = await this.userService.findByNickname(chatRoomDto.nickname);
    const room = await this.chatRoomRepository.createChatRoom(chatRoomDto);
    await this.chatUserRepository.createRoomOwner(user, room);

    return room.id;
  }

  findAll() {
    return `This action returns all chat`;
  }

  findOne(id: string) {
    return `This action returns a #${id} chat`;
  }

  async updatePassword(id: string, type: ChatType, password?: string) {
    const chatRoom = await this.findChatRoomById(id);
    if (!chatRoom) {
      throw new ConflictException([`존재하지 않는 채팅방입니다.`]);
    }
    // 비밀번호 변경요청한 user가 해당 채팅방에 들어와있는지, 권한은 있는지 추가해야함

    return this.chatRoomRepository.updatePassword(chatRoom, password, type);
  }

  //update(id: number, updateChatDto: UpdateChatDto) {
  //  return `This action updates a #${id} chat`;
  //}

  findAllChatRoom(): Promise<ChatRoom[]> {
    return this.chatRoomRepository.findAllChatRoom();
  }

  findChatRoomById(id: string): Promise<ChatRoom> {
    return this.chatRoomRepository.findChatRoomById(id);
  }

  async updateRole(id: string, updateRoleDto: UpdateRoleDto): Promise<void> {
    const chatRoom = await this.findChatRoomById(id);
    let oldAdmin = null;
    if (!chatRoom) {
      throw new ConflictException([`존재하지 않는 채팅방입니다.`]);
    }
    let user = await this.userService.findByNickname(updateRoleDto.owner);
    const owner = await this.chatUserRepository.findChatUser(user, chatRoom);
    if (owner.role !== ChatRole.OWNER) {
      throw new ConflictException(`권한이 없습니다.`);
    }
    // oldAdmin 확실하게 들어온다고 가정하고 진행, 없으면 null, 있으면 객체
    user = await this.userService.findByNickname(updateRoleDto.oldAdmin);
    if (user !== null) {
      oldAdmin = await this.chatUserRepository.findChatUser(user, chatRoom);
    }

    user = await this.userService.findByNickname(updateRoleDto.newAdmin);
    const newAdmin = await this.chatUserRepository.findChatUser(user, chatRoom);
    if (newAdmin.role === ChatRole.ADMIN) {
      throw new ConflictException(`이미 해당 유저는 admin입니다.`);
    }

    this.chatUserRepository.updateAdminRole(newAdmin, oldAdmin);
  }

  async joinChatRoom(id: string, chatRoomDto: ChatRoomDto): Promise<void> {
    const chatRoom = await this.findChatRoomById(id);
    if (!chatRoom) {
      throw new ConflictException([`존재하지 않는 채팅방입니다.`]);
    }
    const user = await this.userService.findByNickname(chatRoomDto.nickname);
    if (
      chatRoom.type === ChatType.PROTECT &&
      chatRoomDto.password !== undefined
    ) {
      return this.chatUserRepository.joinChatRoom(
        user,
        chatRoom,
        chatRoomDto.password,
      );
    }
    return this.chatUserRepository.joinChatRoom(user, chatRoom);
  }

  async leaveChatRoom(id: string, nickname: string): Promise<string> {
    const chatRoom = await this.findChatRoomById(id);
    if (!chatRoom) {
      throw new ConflictException([`존재하지 않는 채팅방입니다.`]);
    }
    const user = await this.userService.findByNickname(nickname);
    const findChatUser = await this.chatUserRepository.findChatUser(
      user,
      chatRoom,
    );
    if (!findChatUser) {
      throw new ConflictException([`채팅방에 없는 유저입니다.`]);
    }
    await this.chatUserRepository.leaveChatRoom(user, chatRoom);
    const chatUsers = await this.chatUserRepository.findChatRoomById(chatRoom);
    if (chatUsers.length === 0) {
      // 채팅방에 유저가 없으면 삭제
      await this.chatRoomRepository.deleteChatRoom(chatRoom.id);
      return `${chatRoom.id} 채팅방이 삭제되었습니다.`;
    }
    // 나간 사람이 Owner여서 새로운 오너가 정해져야 하는 경우
    if (findChatUser.role === ChatRole.OWNER) {
      const newOwner = await this.chatUserRepository.findNewOwner(chatRoom);
      await this.chatUserRepository.updateOwnerRole(newOwner);
      return `${newOwner.id}님이 채팅방 오너로 설정되었습니다.`; // 지금은 db의 PK값 반환
    }
    return `${user.nickname}님이 채팅방에서 나가셨습니다.`;
  }
}
