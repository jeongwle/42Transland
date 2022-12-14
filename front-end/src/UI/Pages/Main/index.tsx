import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Flex } from '@chakra-ui/react';
import MainSocial from '../../Templates/MainSocial';
import MainStandby from '../../Templates/MainStandby';
import { SocketState, useSocket } from '../../../Hooks/useSocket';
import Loading from '../../Templates/Loading';
import OTPRevise from '../OTPRevise';
import Profile from '../Profile';
import Chat from '../Chat';
import useGameInviteNotify from '../../../Hooks/useGameInviteNotify';
import { DirectMessageProvider } from '../../../Hooks/useDirectMessageNotify';
import { ChatStateProvider } from '../../../Hooks/useChatState';

function Main() {
  const { state } = useSocket();
  const { WarningDialogComponent } = useGameInviteNotify();

  if (process.env.REACT_APP_WEBSOCKET_REQUIRED === 'true') {
    switch (state.socketState) {
      case SocketState.CONNECTING:
        return <Loading message="서버에 접속중..." />;
      case SocketState.CONNECT_ERROR:
        return <Loading message="서버에 연결하지 못했습니다." />;
      case SocketState.DISCONNECTED:
        return <Loading message="서버와 연결이 끊어졌습니다." />;
      default:
        break;
    }
  }

  return (
    <DirectMessageProvider>
      <ChatStateProvider>
        <Flex h="100vh" flexDirection={{ base: 'column', lg: 'row' }}>
          <Box
            display={{ base: 'flex', lg: 'flex' }}
            width="full"
            justifyContent="center"
          >
            <MainStandby />
          </Box>
          <Box
            minW={{ base: 'full', lg: '400px' }}
            maxW="400px"
            height="full"
            bgColor="white"
          >
            <MainSocial />
          </Box>
          <Routes>
            <Route path="/otp/:name" element={<OTPRevise />} />
            <Route path="/user/:name" element={<Profile />} />
            <Route path="/chat/:id/*" element={<Chat dm={false} />} />
            <Route path="/dm/:userName/*" element={<Chat dm />} />
          </Routes>
          {WarningDialogComponent}
        </Flex>
      </ChatStateProvider>
    </DirectMessageProvider>
  );
}

export default Main;
