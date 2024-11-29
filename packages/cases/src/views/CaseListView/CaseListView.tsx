import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CaseApi,
  UserApi,
  type Case,
  type Pagination,
  type User,
} from 'shared';
import { Box, Button, Heading, Select as ThemeSelect } from 'theme-ui';
import { PAGINATION_ITEMS_PER_PAGE } from './constants';
import Select, { type MultiValue } from 'react-select';

export const CaseListView = () => {
  const [pagination, setPagination] = useState<Pagination>({
    pageIndex: 0,
    pageSize: 25,
  });

  const casesQuery = CaseApi.useGetCasesQuery(pagination);
  const usersQuery = UserApi.useGetUsersQuery();

  const usersMap = useMemo(() => {
    return usersQuery.data?.reduce(
      (acc, user) => {
        acc[user.identifier] = user;
        return acc;
      },
      {} as Record<User['identifier'], User>,
    );
  }, [usersQuery.data]);

  const casesColumns = useMemo(() => {
    const columnHelper = createColumnHelper<Case>();
    if (!usersMap) return [];

    // identifier: 'eb038a4c-1b7a-4a88-80ee-8a086b0fdd3d',
    // assignee_id: '287c3a82-ea31-4db1-b0a5-ce7f0bf975fe',
    // status: 'CASE_ON_HOLD',
    // name: 'Reilly - Hamill',

    return [
      columnHelper.accessor('name', {
        cell: (cell) => (
          <Link
            to={`${cell.row.original.identifier}`}
            state={{ caseDetails: cell.row.original }}
          >
            {cell.getValue()}
          </Link>
        ),
        header: () => <p>Name</p>,
      }),

      columnHelper.accessor('status', {
        cell: (cell) => <p>{cell.getValue()}</p>,
        header: () => <p>Status</p>,
      }),

      columnHelper.accessor('assignee_id', {
        cell: (cell) => {
          // todo: marke inactive users
          return <p>{usersMap[cell.getValue()].name}</p>;
        },
        header: () => <p>Assignee</p>,
        filterFn: (row, columnId, filterValue) => {
          const userId: string = row.getValue(columnId);
          const userName = usersMap[userId].name || '';
          return userName.toLowerCase().includes(filterValue.toLowerCase());
        },
      }),
    ];
  }, [usersMap]);

  const table = useReactTable({
    data: casesQuery.data?.cases || [],
    columns: casesColumns,
    getCoreRowModel: getCoreRowModel(),
    state: { pagination },
    onPaginationChange: setPagination,
    manualPagination: true,
  });

  const userOptions = useMemo(() => {
    return usersQuery.data?.map((user) => ({
      value: user.identifier,
      label: user.name,
    }));
  }, [usersQuery.data]);

  const isDataReady = Boolean(casesQuery.data && usersQuery.data);

  const handleSelectUser = (
    users: MultiValue<{ value: string; label: string }>,
  ) => console.log(users);

  const handleChangeCasePerPage = (count: string) => {
    setPagination({ ...pagination, pageSize: +count });
  };

  if (casesQuery.isLoading || usersQuery.isLoading)
    return <div>...Loading</div>;
  if (casesQuery.isError || usersQuery.isError)
    return <div>Something went wrong</div>;

  return (
    <Box>
      <Heading>Cases</Heading>
      {isDataReady ? (
        <>
          {userOptions && (
            <Select
              isMulti
              options={userOptions}
              onChange={(users) => handleSelectUser(users)}
            />
          )}

          <table>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <Box>
            <Button
              onClick={() => table.setPageIndex(0)}
              disabled={!casesQuery.data?.prev}
            >
              First
            </Button>
            <Button
              onClick={() => table.previousPage()}
              disabled={!casesQuery.data?.prev}
            >
              Previous
            </Button>

            <span>Page {table.getState().pagination.pageIndex + 1}</span>

            <Box>
              <ThemeSelect
                sx={{ width: 'size-xs' }}
                onChange={(e) => handleChangeCasePerPage(e.target.value)}
              >
                {PAGINATION_ITEMS_PER_PAGE.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </ThemeSelect>
            </Box>

            <Button
              onClick={() => table.nextPage()}
              disabled={!casesQuery.data?.next}
            >
              Next
            </Button>
          </Box>
        </>
      ) : null}
    </Box>
  );
};
