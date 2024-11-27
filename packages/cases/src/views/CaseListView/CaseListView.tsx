import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import { CaseApi } from 'shared';
import { Box, Heading } from 'theme-ui';
import { casesColumns } from './columns';

export const CaseListView = () => {
  const casesQuery = CaseApi.useGetCasesQuery();

  const table = useReactTable({
    data: casesQuery.data?.cases || [],
    columns: casesColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (casesQuery.isLoading) return <div>...Loading</div>;
  if (casesQuery.isError) return <div>Somthing went wrong</div>;

  return (
    <Box>
      <Heading>Cases</Heading>
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
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
};
