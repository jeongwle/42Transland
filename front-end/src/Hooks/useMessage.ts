import React from 'react';
import axios from 'axios';
import { useChat } from './useChat';
import ChatMemberProps from '../Props/ChatMemberProps';
import ChatInfoProps from '../Props/ChatInfoProps';

interface ChatMessageProps {
  senderNickName: string;
  content: string;
}

export default function useMessage() {
  const [, dispatch] = useChat();

  const insertRoomMember = React.useCallback(
    (chatMember: ChatMemberProps) => {
      dispatch({
        action: 'insertMember',
        chatMember,
      });
    },
    [dispatch],
  );
  const deleteRoomMember = React.useCallback(
    (name: string) => {
      dispatch({
        action: 'deleteMember',
        name,
      });
    },
    [dispatch],
  );
  const dispatchRoomInfo = React.useCallback(
    (chanInfoProps: ChatInfoProps) => {
      dispatch({
        action: 'updateInfo',
        chatInfo: chanInfoProps,
      });
    },
    [dispatch],
  );
  const displayDMHistory = React.useCallback(
    (targetName: string) => {
      axios.get(`/dm/${targetName}`).then((response) => {
        const DMList: ChatMessageProps[] = response.data;
        DMList.forEach((dm) => {
          dispatch({
            action: 'chat',
            name: dm.senderNickName,
            message: dm.content,
          });
        });
      });
    },
    [dispatch],
  );
  const dispatchChat = React.useCallback(
    (nickname: string, message: string) => {
      dispatch({
        action: 'chat',
        name: nickname,
        message,
      });
    },
    [dispatch],
  );

  return {
    dispatchRoomInfo,
    dispatchChat,
    displayDMHistory,
    insertRoomMember,
    deleteRoomMember,
  };
}
