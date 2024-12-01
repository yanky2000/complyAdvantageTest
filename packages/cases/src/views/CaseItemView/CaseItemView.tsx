import { useLocation } from 'react-router-dom';
import { Container } from 'theme-ui';

export function CaseItemView() {
  const location = useLocation();
  const { caseDetails } = location.state || {};
  if (!caseDetails) return 'No Data';

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
      CaseItem
      <ul>
        <li>Id: {caseDetails.identifier}</li>
        <li>Name: {caseDetails.name}</li>
        <li>Status: {caseDetails.status}</li>
        <li>Assignee: {caseDetails.assignee_id}</li>
      </ul>
    </Container>
  );
}
