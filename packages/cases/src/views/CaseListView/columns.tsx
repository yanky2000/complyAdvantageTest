import { createColumnHelper } from '@tanstack/react-table';
import { Case } from 'shared';

const columnHelper = createColumnHelper<Case>();

// identifier: 'eb038a4c-1b7a-4a88-80ee-8a086b0fdd3d',
// assignee_id: '287c3a82-ea31-4db1-b0a5-ce7f0bf975fe',
// status: 'CASE_ON_HOLD',
// name: 'Reilly - Hamill',

export const casesColumns = [
  columnHelper.accessor('name', {
    cell: (cell) => <p>{cell.getValue()}</p>,
    header: (props) => <p>Name</p>,
  }),

  columnHelper.accessor('status', {
    cell: (cell) => <p>{cell.getValue()}</p>,
    header: (props) => <p>Status</p>,
  }),

  columnHelper.accessor('assignee_id', {
    cell: (cell) => <p>{cell.getValue()}</p>,
    header: (props) => <p>Assignee</p>,
  }),
];
