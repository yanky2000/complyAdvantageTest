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
import {
  BADGE_STATUS_COLORS_MAP,
  BADGE_STATUS_MAP,
  PAGINATION_ITEMS_PER_PAGE,
} from './constants';
import Select, { type MultiValue } from 'react-select';

export const CaseListView = () => {
  const [pagination, setPagination] = useState<Pagination>({
    pageIndex: 0,
    pageSize: PAGINATION_ITEMS_PER_PAGE[2],
  });

  const [selectedUserIds, setSelectedUserIds] = useState<User['identifier'][]>(
    [],
  );

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

  const cases = casesQuery.data?.cases;

  const filteredCases = useMemo(() => {
    if (!cases) return undefined;
    if (!selectedUserIds || selectedUserIds.length === 0) return cases;
    return cases.filter(({ assignee_id }) => {
      return selectedUserIds.includes(assignee_id);
    });
  }, [cases, selectedUserIds]);

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
        cell: (cell) => {
          const status = cell.getValue();
          return (
            <Box variant={`badges.${BADGE_STATUS_COLORS_MAP[status]}`}>
              {BADGE_STATUS_MAP[status]}
            </Box>
          );
        },
        header: () => <p>Status</p>,
      }),

      columnHelper.accessor('assignee_id', {
        cell: (cell) => {
          // todo: marke inactive users
          return <p>{usersMap[cell.getValue()].name}</p>;
        },
        header: () => <p>Assignee</p>,
      }),
    ];
  }, [usersMap]);

  const table = useReactTable({
    data: filteredCases || [],
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

  const handleSelectUser = (
    users: MultiValue<{ value: string; label: string }>,
  ) => {
    const seletedUserIds = users.reduce((acc, user) => {
      acc.push(user.value);
      return acc;
    }, [] as string[]);

    setSelectedUserIds(seletedUserIds);
  };

  const handleChangeCasePerPage = (count: string) => {
    setPagination({ ...pagination, pageSize: +count });
  };

  const isDataReady = Boolean(casesQuery.data && usersQuery.data);

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
                defaultValue={pagination.pageSize}
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
