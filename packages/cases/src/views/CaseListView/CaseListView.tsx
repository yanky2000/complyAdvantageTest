import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CaseApi,
  UserApi,
  type Case,
  type Pagination,
  type User,
} from 'shared';
import {
  Box,
  Button,
  Container,
  Heading,
  Select as ThemeSelect,
} from 'theme-ui';
import {
  BADGE_STATUS_COLORS_MAP,
  BADGE_STATUS_MAP,
  PAGINATION_ITEMS_PER_PAGE,
} from './constants';
import Select, { type MultiValue } from 'react-select';
import { PiCaretLeft, PiCaretRight } from 'react-icons/pi';

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

    return [
      columnHelper.accessor('name', {
        cell: (cell) => (
          <Link
            to={`${cell.row.original.identifier}`}
            state={{ caseDetails: cell.row.original }}
            sx={{
              textDecoration: 'none',
              color: 'textLink',
              fontWeight: 'font-weight-semi-bold',
              cursor: 'pointer',
              transition: 'color 0.2s ease',
              '&:hover': {
                color: 'accent500',
                textDecoration: 'underline',
              },
            }}
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
            <Box
              variant={`badges.${BADGE_STATUS_COLORS_MAP[status]}`}
              paddingLeft="spacing-xs"
              paddingRight="spacing-xs"
            >
              {BADGE_STATUS_MAP[status]}
            </Box>
          );
        },
        header: () => <p>Status</p>,
      }),

      columnHelper.accessor('assignee_id', {
        cell: (cell) => {
          // todo: marke inactive users
          const value = cell.getValue();
          const status = usersMap[value].active;
          return (
            <p {...(!status && { sx: { color: 'neutral400' } })}>
              {usersMap[cell.getValue()].name}
            </p>
          );
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

  // handle out-of-boundry case
  useEffect(() => {
    if (
      casesQuery.data?.cases.length === 0 &&
      !casesQuery.data?.prev &&
      !casesQuery.data?.next
    ) {
      setPagination((prev) => ({
        ...prev,
        pageIndex: 0,
      }));
    }
  }, [casesQuery.data?.cases, casesQuery.data?.prev, casesQuery.data?.next]);

  const isDataReady = Boolean(casesQuery.data && usersQuery.data);

  if (casesQuery.isLoading || usersQuery.isLoading)
    return <div>...Loading</div>;
  if (casesQuery.isError || usersQuery.isError)
    return <div>Something went wrong</div>;

  return (
    <Container
      padding="spacing-md"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        margin: '0 auto',
        maxWidth: 'size-4xl',
        justifyContent: 'center',
      }}
    >
      <Heading>Cases</Heading>
      {isDataReady ? (
        <>
          {userOptions && (
            <Select
              isMulti
              options={userOptions}
              onChange={(users) => handleSelectUser(users)}
              sx={{ marginBottom: 'spacing-md' }}
            />
          )}

          <table
            sx={{
              width: '100%',
              tableLayout: 'fixed',
              borderCollapse: 'collapse',
            }}
          >
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      sx={{
                        textAlign: 'left',
                        border: '1px solid #ddd',
                        padding: 'spacing-xs',
                        backgroundColor: 'bgPanel',
                        color: 'textBase',
                        position: 'sticky',
                        top: 0,
                      }}
                    >
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
                    <td
                      key={cell.id}
                      sx={{
                        border: '1px solid #ddd',
                        padding: 'spacing-xs',
                        textAlign: 'left',
                      }}
                    >
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

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 'spacing-3xs',
              marginTop: 'spacing-md',
              justifyContent: 'flex-end',
            }}
          >
            <Button
              variant="icon"
              onClick={() => table.previousPage()}
              disabled={!casesQuery.data?.prev}
              sx={{ padding: 'spacing-3xs', transition: 'all .3s ease' }}
            >
              <PiCaretLeft
                size={24}
                {...(!casesQuery.data?.prev && { sx: { color: 'neutral400' } })}
              />
            </Button>

            <Box
              sx={{
                display: 'flex',
                width: 'size-3xs',
                justifyContent: 'center',
              }}
            >
              <span>Page {table.getState().pagination.pageIndex + 1}</span>
            </Box>

            <Button
              variant="icon"
              onClick={() => table.nextPage()}
              disabled={!casesQuery.data?.next}
              sx={{ padding: 'spacing-3xs', transition: 'all .3s ease' }}
            >
              <PiCaretRight
                size={24}
                {...(!casesQuery.data?.next && { sx: { color: 'neutral400' } })}
              />
            </Button>

            <Box
              sx={{ display: 'flex', alignItems: 'center', ml: 'spacing-md' }}
            >
              <Box mr="spacing-xs">Rows per page</Box>
              <ThemeSelect
                sx={{
                  width: '52px',
                  paddingLeft: 'spacing-xs',
                  paddingRight: 'spacing-xs',
                }}
                onChange={(e) => handleChangeCasePerPage(e.target.value)}
                value={pagination.pageSize}
              >
                {PAGINATION_ITEMS_PER_PAGE.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </ThemeSelect>
            </Box>
          </Box>
        </>
      ) : null}
    </Container>
  );
};
