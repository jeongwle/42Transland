import React from 'react';
import { io, Socket } from 'socket.io-client';

enum SocketState {
  CONNECTING,
  CONNECTED,
  CONNECT_ERROR,
  DISCONNECTED,
}

type SocketStateType = {
  socket: Socket | null;
  socketState: SocketState;
};
const initialSocketState: SocketStateType = {
  socket: null,
  socketState: SocketState.DISCONNECTED,
};

type SocketActionType =
  | { action: 'connect'; socket: Socket }
  | { action: 'connect_failed' }
  | { action: 'connected' }
  | { action: 'disconnect' };

type SocketContextType = {
  state: SocketStateType;
  dispatch: React.Dispatch<SocketActionType>;
};

const SocketStateContext = React.createContext<SocketContextType | null>(null);

function useSocket() {
  const context = React.useContext(SocketStateContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context as SocketContextType;
}

function SocketReducer(beforeState: SocketStateType, action: SocketActionType) {
  switch (action.action) {
    case 'connect':
      return {
        ...beforeState,
        socket: action.socket,
        socketState: SocketState.CONNECTING,
      };
    case 'connect_failed':
      return { ...beforeState, socketState: SocketState.CONNECT_ERROR };
    case 'connected':
      return { ...beforeState, socketState: SocketState.CONNECTED };
    case 'disconnect':
      return {
        ...beforeState,
        socket: null,
        socketState: SocketState.DISCONNECTED,
      };
    default:
      return beforeState;
  }
}

function SocketProvider({
  query,
  children,
}: {
  query: { [key: string]: any };
  children: React.ReactNode;
}) {
  const [state, dispatch] = React.useReducer(SocketReducer, initialSocketState);
  const val = React.useMemo(() => ({ state, dispatch }), [state, dispatch]);
  React.useEffect(() => {
    const socket = io(
      `${process.env.REACT_APP_WEBSOCKET_HOST}${process.env.REACT_APP_WEBSOCKET_URI}`,
      {
        transports: ['websocket'],
        autoConnect: false,
        query,
      },
    );
    dispatch({ action: 'connect', socket });
    socket.on('connect_failed', () => {
      dispatch({ action: 'connect_failed' });
    });
    socket.on('connect', () => {
      dispatch({ action: 'connected' });
    });
    socket.connect();
  }, [query]);
  return (
    <SocketStateContext.Provider value={val}>
      {children}
    </SocketStateContext.Provider>
  );
}

export { SocketProvider, useSocket, SocketState };