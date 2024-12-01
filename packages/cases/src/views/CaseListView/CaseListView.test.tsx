import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, Mock } from 'vitest';
import { CaseListView } from './CaseListView';
import { CaseApi, UserApi } from 'shared'; // Import the mocked module
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

// Mock APIs using Vitest
vi.mock('shared', () => ({
  CaseApi: {
    useGetCasesQuery: vi.fn(), // Mocked function
  },
  UserApi: {
    useGetUsersQuery: vi.fn(), // Mocked function
  },
}));

const queryClient = new QueryClient();

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

  it('handles pagination correctly', () => {
    (CaseApi.useGetCasesQuery as Mock).mockReturnValue({
      data: { cases: [], prev: true, next: true },
    });
    (UserApi.useGetUsersQuery as Mock).mockReturnValue({ data: [] });

    renderWithProviders(<CaseListView />);

    const prevButton = screen.getByRole('button', { name: /previous/i });
    const nextButton = screen.getByRole('button', { name: /next/i });

    // Buttons should be enabled initially based on mock data
    expect(prevButton).not.toBeDisabled();
    expect(nextButton).not.toBeDisabled();

    // Simulate a click on next button
    fireEvent.click(nextButton);
    // ! todo: Additional logic for verifying state changes or API calls could go here
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
});
