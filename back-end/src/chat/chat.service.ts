import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRoomRepository } from './chat.room.repository';
import { ChatRoom } from './entities/chat.room.entity';
import { CreateChatRoomDto } from './dto/create.chat.room.dto';
import { ChatType, CountType } from './constants/chat.type.enum';
import { UsersService } from 'src/users/users.service';
import { ChatUserRepository } from './chat.user.repository';
import { ChatRole } from './constants/chat.role.enum';
import { ChatUser } from './entities/chat.user.entity';
import { User } from 'src/users/entities/user.entity';
import { ChatInfoDto } from './dto/chat.info.dto';
import { ChatUserUpdateType } from 'src/socket/chat/constants/chat.user.update.type.enum';
import { SocketService } from 'src/socket/socket.service';
import { SocketGateway } from 'src/socket/socket.gateway';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoomRepository)
    private readonly chatRoomRepository: ChatRoomRepository,
    @InjectRepository(ChatUserRepository)
    private readonly chatUserRepository: ChatUserRepository,
    private readonly userService: UsersService,

    @Inject(forwardRef(() => SocketGateway))
    private readonly socketGateway: SocketGateway,

    @Inject(forwardRef(() => SocketService))
    private readonly socketService: SocketService,
  ) {}

  async createChatRoom(
    user: User,
    chatRoomDto: CreateChatRoomDto,
  ): Promise<string> {
    const room = await this.chatRoomRepository.createChatRoom(chatRoomDto);
    this.chatUserRepository.createRoomOwner(user, room);
    this.socketService.handleJoinChatRoom(room.id, user.id);
    return room.id;
  }

  async updatePassword(
    id: string,
    user: User,
    type: ChatType,
    password?: string,
  ): Promise<void> {
    const chatRoom = await this.findChatRoomById(id);
    const chatUser = await this.findChatUser(user, chatRoom);
    if (chatUser.role !== ChatRole.OWNER) {
      throw new BadRequestException(`????????? ????????????.`);
    }
    if (type === ChatType.PROTECT && password) {
      this.socketService.handleUpdateChatType(
        this.socketGateway.server,
        chatRoom.id,
        false,
      );
    } else {
      this.socketService.handleUpdateChatType(
        this.socketGateway.server,
        chatRoom.id,
        true,
      );
    }
    await this.chatRoomRepository.updatePassword(chatRoom, password, type);
  }

  async findAllChatRoom(): Promise<ChatInfoDto[]> {
    const result = await this.chatRoomRepository.findAllChatRoom();

    const rooms = result.map((findRoom) => {
      const room: ChatInfoDto = {
        id: findRoom.id,
        name: findRoom.name,
        type: findRoom.type,
        createdAt: findRoom.createdAt,
        updateAt: findRoom.updatedAt,
        count: findRoom.count,
      };
      return room;
    });
    return rooms;
  }

  async findChatRoomById(id: string): Promise<ChatRoom> {
    const chatRoom = await this.chatRoomRepository.findChatRoomById(id);
    if (!chatRoom) {
      throw new NotFoundException([`???????????? ?????? ??????????????????.`]);
    }
    return chatRoom;
  }

  async findChatRoomUsers(id: string): Promise<ChatUser[]> {
    return this.chatUserRepository.findChatRoomUsers(id);
  }

  async findChatUser(user: User, chatRoom: ChatRoom): Promise<ChatUser> {
    const chatUser = await this.chatUserRepository.findChatUser(user, chatRoom);
    if (!chatUser) {
      throw new NotFoundException([`???????????? ?????? ?????? ?????????.`]);
    }
    return chatUser;
  }

  async updateRole(id: string, user: User, nickname: string): Promise<void> {
    const chatRoom = await this.findChatRoomById(id);
    const owner = await this.findChatUser(user, chatRoom);

    if (owner.role !== ChatRole.OWNER) {
      throw new UnauthorizedException(`????????? ????????????.`);
    }

    const findUser = await this.userService.findByNickname(nickname);
    const newAdmin = await this.findChatUser(findUser, chatRoom);
    if (newAdmin.role === ChatRole.ADMIN) {
      throw new ConflictException(`?????? ??????????????????.`);
    }

    const deleteUser = await this.chatUserRepository.updateAdminRole(
      newAdmin,
      chatRoom,
    );
    if (deleteUser !== null) {
      this.socketService.handleUpdateChatUser(
        this.socketGateway.server,
        id,
        deleteUser.user.id,
        deleteUser.user.nickname,
        ChatUserUpdateType.ADMIN,
        false,
      );
    }
    this.socketService.handleUpdateChatUser(
      this.socketGateway.server,
      id,
      findUser.id,
      nickname,
      ChatUserUpdateType.ADMIN,
      true,
    );
  }

  async deleteRole(id: string, user: User, nickname: string): Promise<void> {
    const chatRoom = await this.findChatRoomById(id);
    const owner = await this.findChatUser(user, chatRoom);

    if (owner.role !== ChatRole.OWNER) {
      throw new UnauthorizedException(`????????? ????????????.`);
    }

    const findUser = await this.userService.findByNickname(nickname);
    const oldAdmin = await this.findChatUser(findUser, chatRoom);
    if (oldAdmin.role !== ChatRole.ADMIN) {
      throw new BadRequestException(`?????? ????????? ???????????? ????????????.`);
    }
    await this.chatUserRepository.deleteAdminRole(chatRoom);
    this.socketService.handleUpdateChatUser(
      this.socketGateway.server,
      id,
      findUser.id,
      nickname,
      ChatUserUpdateType.ADMIN,
      false,
    );
  }

  async joinChatRoom(id: string, user: User, password: string): Promise<void> {
    const chatRoom = await this.findChatRoomById(id);
    const isBannedUser = await this.chatRoomRepository.findBannedUser(id, user);
    if (isBannedUser) {
      throw new BadRequestException(`?????? ????????? ???????????????.`);
    }
    if (chatRoom.type === ChatType.PROTECT && password !== undefined) {
      await this.chatUserRepository.joinChatRoom(user, chatRoom, password);
    } else {
      await this.chatUserRepository.joinChatRoom(user, chatRoom);
    }
    await this.chatRoomRepository.updateCount(chatRoom, CountType.JOIN);
    this.socketService.handleJoinChatRoom(chatRoom.id, user.id);
  }

  async leaveChatRoom(id: string, user: User): Promise<void> {
    const chatRoom = await this.findChatRoomById(id);
    const findChatUser = await this.findChatUser(user, chatRoom);

    await this.chatUserRepository.leaveChatRoom(user, chatRoom);
    this.socketService.handleLeaveChatRoom(user.id, ChatUserUpdateType.LEAVE);
    const chatUsers = await this.chatUserRepository.findChatRoomById(chatRoom);
    if (chatUsers.length === 0) {
      // ???????????? ????????? ????????? ??????
      await this.chatRoomRepository.deleteChatRoom(chatRoom.id);
      return;
    }
    await this.chatRoomRepository.updateCount(chatRoom, CountType.LEAVE);
    // ?????? ????????? Owner?????? ????????? ????????? ???????????? ?????? ??????
    if (findChatUser.role === ChatRole.OWNER) {
      const newOwner = await this.chatUserRepository.findNewOwner(chatRoom);
      const newOwnerUser = await this.chatUserRepository.findChatUserNickname(
        newOwner,
      );

      await this.chatUserRepository.updateOwnerRole(newOwner);
      this.socketService.handleUpdateChatUser(
        this.socketGateway.server,
        id,
        newOwnerUser.id,
        newOwnerUser.nickname,
        ChatUserUpdateType.OWNER,
        true,
      );
    }
  }

  async kickChatUser(id: string, user: User, nickname: string): Promise<void> {
    const chatRoom = await this.findChatRoomById(id);
    const findChatUser = await this.findChatUser(user, chatRoom);
    const kickUser = await this.userService.findByNickname(nickname);
    const kickChatUser = await this.findChatUser(kickUser, chatRoom);

    if (
      !(
        findChatUser.role === ChatRole.OWNER ||
        findChatUser.role === ChatRole.ADMIN
      )
    ) {
      throw new UnauthorizedException(`????????? ????????????.`);
    }
    if (
      user.nickname === nickname ||
      kickChatUser.role === ChatRole.OWNER ||
      (findChatUser.role === ChatRole.ADMIN &&
        kickChatUser.role === ChatRole.ADMIN)
    ) {
      throw new BadRequestException(`????????? ??? ????????????.`);
    }
    await this.chatUserRepository.leaveChatRoom(kickUser, chatRoom);
    await this.chatRoomRepository.updateCount(chatRoom, CountType.LEAVE);
    this.socketService.handleLeaveChatRoom(
      kickUser.id,
      ChatUserUpdateType.KICK,
    );
  }

  async banChatUser(id: string, user: User, nickname: string): Promise<void> {
    const chatRoom = await this.findChatRoomById(id);
    const findChatUser = await this.findChatUser(user, chatRoom);
    const banUser = await this.userService.findByNickname(nickname);
    const banChatUser = await this.findChatUser(banUser, chatRoom);

    if (
      !(
        findChatUser.role === ChatRole.OWNER ||
        findChatUser.role === ChatRole.ADMIN
      )
    ) {
      throw new UnauthorizedException(`????????? ????????????.`);
    }
    if (
      user.nickname === nickname ||
      banChatUser.role === ChatRole.OWNER ||
      (findChatUser.role === ChatRole.ADMIN &&
        banChatUser.role === ChatRole.ADMIN)
    ) {
      throw new BadRequestException(`?????? ????????? ??? ????????????.`);
    }

    if (await this.chatRoomRepository.findBannedUser(id, banUser)) {
      throw new ConflictException(`?????? ?????? ????????? ???????????????.`);
    }
    await this.chatUserRepository.leaveChatRoom(banUser, chatRoom);
    await this.chatRoomRepository.banChatRoom(chatRoom, banUser);
    await this.chatRoomRepository.updateCount(chatRoom, CountType.LEAVE);
    this.socketService.handleLeaveChatRoom(banUser.id, ChatUserUpdateType.BAN);
  }

  async sendChat(id: string, user: User, content: string): Promise<void> {
    const chatRoom = await this.findChatRoomById(id);
    const chatUser = await this.findChatUser(user, chatRoom);

    if (chatUser.unmutedAt) {
      const now: Date = new Date();
      const diff = chatUser.unmutedAt.getTime() - now.getTime();
      if (diff > 0) {
        throw new BadRequestException([
          `${Math.floor(diff / 1000)}??? ?????? ????????? ????????? ??? ????????????.`,
        ]);
      }
    }
    this.socketService.handleChatMessage(
      this.socketGateway.server,
      user.nickname,
      chatRoom.id,
      content,
    );
  }

  async updateChatMute(
    id: string,
    user: User,
    nickname: string,
  ): Promise<void> {
    const chatRoom = await this.findChatRoomById(id);
    const myChatUser = await this.findChatUser(user, chatRoom);
    const opponent = await this.userService.findByNickname(nickname);
    const chatUser = await this.findChatUser(opponent, chatRoom);

    if (
      !(
        myChatUser.role === ChatRole.OWNER || myChatUser.role === ChatRole.ADMIN
      )
    ) {
      throw new UnauthorizedException(`????????? ????????????.`);
    }
    if (
      user.nickname === nickname ||
      chatUser.role === ChatRole.OWNER ||
      (myChatUser.role === ChatRole.ADMIN && chatUser.role === ChatRole.ADMIN)
    ) {
      throw new BadRequestException(`?????? ???????????? mute??? ??? ??? ????????????.`);
    }

    const muteMinutes = 1;
    const muteTime: Date = new Date();
    muteTime.setMinutes(muteTime.getMinutes() + muteMinutes);

    chatUser.unmutedAt = muteTime;
    try {
      await this.chatUserRepository.save(chatUser);
    } catch (error) {
      throw new InternalServerErrorException();
    }

    setTimeout(async () => {
      chatUser.unmutedAt = null;
      await this.chatUserRepository.save(chatUser);
      this.socketService.handleUpdateChatUser(
        this.socketGateway.server,
        id,
        opponent.id,
        nickname,
        ChatUserUpdateType.MUTE,
        false,
      );
    }, muteMinutes * 60 * 1000);

    this.socketService.handleUpdateChatUser(
      this.socketGateway.server,
      id,
      opponent.id,
      nickname,
      ChatUserUpdateType.MUTE,
      true,
    );
  }

  async updateChatUnMute(
    id: string,
    user: User,
    nickname: string,
  ): Promise<void> {
    const chatRoom = await this.findChatRoomById(id);

    const myChatUser = await this.findChatUser(user, chatRoom);
    const opponent = await this.userService.findByNickname(nickname);
    const chatUser = await this.findChatUser(opponent, chatRoom);

    if (
      !(
        myChatUser.role === ChatRole.OWNER || myChatUser.role === ChatRole.ADMIN
      )
    ) {
      throw new UnauthorizedException(`????????? ????????????.`);
    }
    if (
      user.nickname === nickname ||
      chatUser.role === ChatRole.OWNER ||
      (myChatUser.role === ChatRole.ADMIN && chatUser.role === ChatRole.ADMIN)
    ) {
      throw new BadRequestException(`?????? ???????????? unMute??? ??? ??? ????????????.`);
    }
    if (chatUser.unmutedAt === null) {
      throw new BadRequestException(
        `????????? ?????? ?????? ???????????? ????????? ????????? ??? ??? ????????????.`,
      );
    }
    chatUser.unmutedAt = null;
    try {
      await this.chatUserRepository.save(chatUser);
    } catch (error) {
      throw new InternalServerErrorException();
    }
    this.socketService.handleUpdateChatUser(
      this.socketGateway.server,
      id,
      opponent.id,
      nickname,
      ChatUserUpdateType.MUTE,
      false,
    );
  }
}
