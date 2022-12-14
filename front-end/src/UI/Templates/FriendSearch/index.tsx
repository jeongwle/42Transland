import React from 'react';
import { Divider, HStack, Input, VStack } from '@chakra-ui/react';
import { Search2Icon } from '@chakra-ui/icons';
import { useQuery } from '@tanstack/react-query';
import USERS_SEARCH_GET from '../../../Queries/Users/Search';
import SearchFriendResultElement from '../../Molecules/SearchFriendResultElement';
import useMe from '../../../Hooks/useMe';

function FriendSearch() {
  const [value, setValue] = React.useState('');
  const { data: searchResult } = useQuery(USERS_SEARCH_GET(value));
  const { nickname } = useMe();

  return (
    <VStack h="full">
      <HStack w="full">
        <Search2Icon boxSize="2.5em" p={1} />
        <Input
          placeholder="친구 검색"
          onChange={(event) => setValue(event.target.value)}
        />
      </HStack>
      <Divider />
      <VStack w="full" flexGrow={1} overflowY="auto">
        {searchResult?.map(
          (friend) =>
            friend.nickname !== nickname && (
              <SearchFriendResultElement
                key={friend.id}
                id={friend.id}
                nickname={friend.nickname}
                profileImg={`${process.env.REACT_APP_API_HOST}/${friend.profileImg}`}
              />
            ),
        )}
      </VStack>
    </VStack>
  );
}

export default FriendSearch;
