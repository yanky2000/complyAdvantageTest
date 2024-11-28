import { useLocation } from 'react-router-dom';
import { Box } from 'theme-ui';

export function CaseItemView() {
  const location = useLocation();
  const { caseDetails } = location.state || {};

  return (
    <Box>
      CaseItem
      <ul>
        {caseDetails.identifier}
        {caseDetails.name}
        {caseDetails.status}
        {caseDetails.assignee_id}
      </ul>
    </Box>
  );
}
