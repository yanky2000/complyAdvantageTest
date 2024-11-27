import { useQuery } from '@tanstack/react-query';
import fetchTyped from '../../utils/fetchTyped';
import type { GetCasesResponse } from '../../mockApi/types';

export const useGetCasesQuery = () => {
  return useQuery({
    queryKey: ['cases'],
    queryFn: () => fetchTyped<GetCasesResponse>('/api/cases', {}),
  });
};
