import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Flex } from '@chakra-ui/react';
import MainSocial from '../../Templates/MainSocial';
import MainStandby from '../../Templates/MainStandby';
import { SocketState, useSocket } from '../../../Hooks/useSocket';
import Loading from '../../Templates/Loading';
import RoutedModalExample from '../RoutedModalExample';
import Chat from '../Chat';

function Main() {
  const { state } = useSocket();

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
        <Route path="/example/:name" element={<RoutedModalExample />} />
        <Route path="/chat/:id" element={<Chat />} />
      </Routes>
    </Flex>
  );
}

export default Main;
