import { useQuery } from '@tanstack/react-query';
import fetchTyped from '../../utils/fetchTyped';
import type { GetCasesResponse, Pagination } from '../../mockApi/types';

export const useGetCasesQuery = (pagination: Pagination) => {
  return useQuery({
    queryKey: ['cases', pagination.pageIndex, pagination.pageSize],
    queryFn: () => {
      const url = new URL('/api/cases', globalThis.location.origin);
      url.searchParams.append(
        'page_number',
        (pagination.pageIndex + 1).toString(),
      );
      url.searchParams.append('page_size', pagination.pageSize.toString());

      return fetchTyped<GetCasesResponse>(url.toString(), {});
    },
    placeholderData: (previousData) => previousData,
  });
};
