import React from 'react';
import axios from 'axios';
import { useToast } from '@chakra-ui/react';

export default function useAddFriend(id: number, nickname: string) {
  const toast = useToast();
  const [isSubmitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState({
    headerMessage: '',
    bodyMessage: '',
  });
  const clearError = React.useCallback(
    () => setError({ headerMessage: '', bodyMessage: '' }),
    [setError],
  );
  const cancelRef = React.useRef(null); // TODO: 삭제하기
  const onAddFriend = React.useCallback(() => {
    setSubmitting(true);
    axios
      .put(`/friend/request/${nickname}`)
      .then(() => {
        setSubmitting(false);
        toast({
          title: `${nickname}님에게 친구 요청을 보냈습니다.`,
          status: 'success',
          isClosable: true,
          position: 'top',
        });
      })
      .catch((err) => {
        if (err.response) {
          setError({
            headerMessage: '친구 추가 실패',
            bodyMessage: err.response.data.message,
          });
        } else {
          setError({
            headerMessage: '친구 추가 실패',
            bodyMessage: err.message,
          });
        }
        setSubmitting(false);
      });
  }, [nickname, toast]);
  return { isSubmitting, error, clearError, cancelRef, onAddFriend };
}