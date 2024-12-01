import { MemoryRouter } from 'react-router-dom';
import { vi, Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { CaseListView } from './CaseListView';
import { CaseApi, UserApi } from 'shared';

vi.mock('shared', () => ({
  CaseApi: {
    useGetCasesQuery: vi.fn(),
  },
  UserApi: {
    useGetUsersQuery: vi.fn(),
  },
}));

const queryClient = new QueryClient();

// helper function for tests below
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </MemoryRouter>,
  );
};

describe('CaseListView', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders a heading with text "Cases"', () => {
    (CaseApi.useGetCasesQuery as Mock).mockReturnValue({
      data: { cases: [], prev: false, next: false },
      isLoading: false,
      isError: false,
    });

    (UserApi.useGetUsersQuery as Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<CaseListView />);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Cases' }),
    ).toBeInTheDocument();
  });

  it('renders loading state when cases and users are loading', () => {
    (CaseApi.useGetCasesQuery as Mock).mockReturnValue({ isLoading: true });
    (UserApi.useGetUsersQuery as Mock).mockReturnValue({ isLoading: true });

    renderWithProviders(<CaseListView />);
    expect(screen.getByText('...Loading')).toBeInTheDocument();
  });

  it('renders error state when cases or users API fails', () => {
    (CaseApi.useGetCasesQuery as Mock).mockReturnValue({ isError: true });
    (UserApi.useGetUsersQuery as Mock).mockReturnValue({ isError: true });

    renderWithProviders(<CaseListView />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders cases table when data is available', () => {
    (CaseApi.useGetCasesQuery as Mock).mockReturnValue({
      data: {
        cases: [
          {
            identifier: '1',
            name: 'Case 1',
            status: 'CASE_OPEN',
            assignee_id: '1',
          },
        ],
        prev: false,
        next: true,
      },
    });

    (UserApi.useGetUsersQuery as Mock).mockReturnValue({
      data: [{ identifier: '1', name: 'John Doe', active: true }],
    });

    renderWithProviders(<CaseListView />);
    expect(screen.getByText('Case 1')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('filters cases by user', async () => {
    (CaseApi.useGetCasesQuery as Mock).mockReturnValue({
      data: {
        cases: [
          {
            identifier: '1',
            name: 'Case 1',
            status: 'CASE_OPEN',
            assignee_id: '1',
          },
          {
            identifier: '2',
            name: 'Case 2',
            status: 'CASE_CLOSED',
            assignee_id: '2',
          },
        ],
        prev: false,
        next: true,
      },
    });
    (UserApi.useGetUsersQuery as Mock).mockReturnValue({
      data: [
        { identifier: '1', name: 'John Doe', active: true },
        { identifier: '2', name: 'Smith', active: false },
      ],
    });

    renderWithProviders(<CaseListView />);

    // Filter by user
    const filter = screen.getByLabelText('Filter by assignee');
    await userEvent.click(filter);

    // Select "John Doe"
    const johnDoeOption = await screen.findByRole('option', {
      name: 'John Doe',
    });
    await userEvent.click(johnDoeOption);

    expect(screen.getByText('Case 1')).toBeInTheDocument();
    expect(screen.queryByText('Case 2')).not.toBeInTheDocument();
  });

  it('fetches and displays the next page when clicking the next button', async () => {
    const mockCaseApi = vi.fn();

    // Mock initial data (page 0)
    mockCaseApi.mockImplementation(({ pageIndex }) => {
      if (pageIndex === 0) {
        return {
          data: {
            cases: [
              {
                identifier: '1',
                name: 'Case 1',
                status: 'CASE_OPEN',
                assignee_id: '1',
              },
            ],
            prev: false,
            next: true,
          },
        };
      }
      // Mock data for page 1
      if (pageIndex === 1) {
        return {
          data: {
            cases: [
              {
                identifier: '2',
                name: 'Case 2',
                status: 'CASE_CLOSED',
                assignee_id: '2',
              },
            ],
            prev: true,
            next: false,
          },
        };
      }
      return { data: { cases: [], prev: false, next: false } };
    });

    (CaseApi.useGetCasesQuery as Mock).mockImplementation(mockCaseApi);

    (UserApi.useGetUsersQuery as Mock).mockReturnValue({
      data: [
        { identifier: '1', name: 'John Doe', active: true },
        { identifier: '2', name: 'Jane Smith', active: false },
      ],
    });

    renderWithProviders(<CaseListView />);

    // Verify initial page content
    expect(screen.getByText('Case 1')).toBeInTheDocument();
    expect(screen.queryByText('Case 2')).not.toBeInTheDocument();

    // Click "next" button
    const nextButton = screen.getByRole('button', { name: /next/i });
    await userEvent.click(nextButton);

    // Wait for the next page to load
    await waitFor(() => {
      expect(screen.getByText('Case 2')).toBeInTheDocument();
    });

    // Verify previous page content is no longer displayed
    expect(screen.queryByText('Case 1')).not.toBeInTheDocument();

    // Verify API was called with updated page index
    expect(mockCaseApi).toHaveBeenLastCalledWith({
      pageIndex: 1,
      pageSize: 25,
    });
  });

  it('fetches and displays the previous page when clicking the previous button after navigating to the next page', async () => {
    const mockCaseApi = vi.fn();

    // Mock data for page 1 (current page)
    mockCaseApi.mockImplementation(({ pageIndex }) => {
      if (pageIndex === 1) {
        return {
          data: {
            cases: [
              {
                identifier: '2',
                name: 'Case 2',
                status: 'CASE_CLOSED',
                assignee_id: '2',
              },
            ],
            prev: true,
            next: false,
          },
          isLoading: false,
          isError: false,
        };
      }
      // Mock data for page 0
      if (pageIndex === 0) {
        return {
          data: {
            cases: [
              {
                identifier: '1',
                name: 'Case 1',
                status: 'CASE_OPEN',
                assignee_id: '1',
              },
            ],
            prev: false,
            next: true,
          },
          isLoading: false,
          isError: false,
        };
      }
      return {
        data: { cases: [], prev: false, next: false },
        isLoading: false,
        isError: false,
      };
    });

    (CaseApi.useGetCasesQuery as Mock).mockImplementation(mockCaseApi);

    (UserApi.useGetUsersQuery as Mock).mockReturnValue({
      data: [
        { identifier: '1', name: 'John Doe', active: true },
        { identifier: '2', name: 'Jane Smith', active: false },
      ],
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<CaseListView />);

    // Start with page 0 (initial state)
    await waitFor(() => {
      expect(screen.getByText('Case 1')).toBeInTheDocument();
    });
    expect(screen.queryByText('Case 2')).not.toBeInTheDocument();

    // Simulate clicking the "Next" button to navigate to page 1
    const nextButton = screen.getByRole('button', { name: /next/i });
    await userEvent.click(nextButton);

    // Verify that page 1 content is displayed
    await waitFor(() => {
      expect(screen.getByText('Case 2')).toBeInTheDocument();
    });
    expect(screen.queryByText('Case 1')).not.toBeInTheDocument();

    // Simulate clicking the "Previous" button to navigate back to page 0
    const prevButton = screen.getByRole('button', { name: /previous/i });
    await userEvent.click(prevButton);

    // Verify that page 0 content is displayed
    await waitFor(() => {
      expect(screen.getByText('Case 1')).toBeInTheDocument();
    });
    expect(screen.queryByText('Case 2')).not.toBeInTheDocument();

    // Verify API calls with correct page index for each state
    expect(mockCaseApi).toHaveBeenCalledWith({
      pageIndex: 0,
      pageSize: 25, // Ensure correct pageSize is passed
    });
    expect(mockCaseApi).toHaveBeenCalledWith({
      pageIndex: 1,
      pageSize: 25,
    });
  });

  it('resets to pageIndex 0 when out-of-boundary occurs', async () => {
    const mockCaseApi = vi.fn();

    // Mock data to simulate behavior
    mockCaseApi.mockImplementation(({ pageIndex }) => {
      if (pageIndex === 0) {
        return {
          data: {
            cases: [
              {
                identifier: '1',
                name: 'Case 1',
                status: 'CASE_OPEN',
                assignee_id: '1',
              },
            ],
            prev: false,
            next: true,
          },
          isLoading: false,
          isError: false,
        };
      }
      if (pageIndex === 1) {
        return {
          data: {
            cases: [],
            prev: false,
            next: false, // Simulating out-of-boundary
          },
          isLoading: false,
          isError: false,
        };
      }
      return {
        data: { cases: [], prev: false, next: false },
        isLoading: false,
        isError: false,
      };
    });

    (CaseApi.useGetCasesQuery as Mock).mockImplementation(mockCaseApi);

    (UserApi.useGetUsersQuery as Mock).mockReturnValue({
      data: [{ identifier: '1', name: 'John Doe', active: true }],
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<CaseListView />);

    // Verify initial state (pageIndex 0)
    expect(screen.getByText('Case 1')).toBeInTheDocument();

    // Simulate clicking the "Next" button to move to pageIndex 1
    const nextButton = screen.getByRole('button', { name: /next/i });
    await userEvent.click(nextButton);

    // Verify the out-of-boundary case is handled (pageIndex resets to 0)
    await waitFor(() => {
      expect(mockCaseApi).toHaveBeenLastCalledWith({
        pageIndex: 0,
        pageSize: 25,
      });
      // Ensure initial content is displayed again
      expect(screen.getByText('Case 1')).toBeInTheDocument();
    });

    // Verify no cases are displayed when on the invalid page
    expect(screen.queryByText('Case 2')).not.toBeInTheDocument();
  });

  it('changes rows per page correctly', async () => {
    const mockCaseApi = vi.fn(() => ({
      data: {
        cases: [
          {
            identifier: '1',
            name: 'Case 1',
            status: 'CASE_OPEN',
            assignee_id: '1',
          },
          {
            identifier: '2',
            name: 'Case 2',
            status: 'CASE_CLOSED',
            assignee_id: '2',
          },
        ],
        prev: false,
        next: true,
      },
    }));

    (CaseApi.useGetCasesQuery as Mock).mockImplementation(mockCaseApi);

    (UserApi.useGetUsersQuery as Mock).mockReturnValue({
      data: [
        { identifier: '1', name: 'John Doe', active: true },
        { identifier: '2', name: 'Smith', active: false },
      ],
    });

    renderWithProviders(<CaseListView />);

    // Verify initial call
    expect(mockCaseApi).toHaveBeenCalledWith({ pageIndex: 0, pageSize: 25 });

    // Find and change rows per page
    const rowsPerPageDropdown = screen.getByLabelText('Rows per page');
    expect(rowsPerPageDropdown).toBeInTheDocument();

    await userEvent.selectOptions(rowsPerPageDropdown, ['10']);
    expect(rowsPerPageDropdown).toHaveValue('10');

    // Wait for re-render
    await waitFor(() => {
      expect(mockCaseApi).toHaveBeenLastCalledWith({
        pageIndex: 0,
        pageSize: 10,
      });
    });
  });
});
