import RecordProps from './RecordProps';
import UserInfoProps from './UserInfoProps';

export default interface UserProfileProps extends UserInfoProps {
  gameRecord: RecordProps[];
}
