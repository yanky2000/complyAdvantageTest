import { useQuery } from '@tanstack/react-query';
import fetchTyped from '../../utils/fetchTyped';
import type { GetUsersResponse, User } from '../../mockApi/types';

export const useGetUsersQuery = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => fetchTyped<GetUsersResponse>('/api/users', {}),
    select: (users) => {
      return users?.reduce(
        (acc, user) => {
          acc[user.identifier] = user;
          return acc;
        },
        {} as Record<User['identifier'], User>,
      );
    },
  });
};
