import React from 'react';
import ScrollableVStack from '../../Atoms/ScrollableVStack';

function ElementList(props: { children: React.ReactNode }) {
  const { children } = props;
  return (
    <ScrollableVStack width="100%" maxH="100%">
      {children}
    </ScrollableVStack>
  );
}

export default ElementList;
