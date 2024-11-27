import { useQuery } from '@tanstack/react-query';
import fetchTyped from '../../utils/fetchTyped';
import type { Case } from '../../mockApi/types';

export const useGetCasesQuery = () => {
  return useQuery({
    queryKey: ['cases'],
    queryFn: () => fetchTyped<Case[]>('/api/cases', {}),
  });
};
