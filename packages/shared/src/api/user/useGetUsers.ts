import { useQuery } from '@tanstack/react-query';
import fetchTyped from '../../utils/fetchTyped';
import type { GetUsersResponse } from '../../mockApi/types';

export const useGetUsersQuery = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => fetchTyped<GetUsersResponse>('/api/users', {}),
  });
};
