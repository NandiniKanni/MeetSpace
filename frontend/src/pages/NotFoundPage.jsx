import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="center-page">
      <EmptyState
        icon="alert"
        title="Page not found"
        description="The page you are looking for does not exist."
        action={<Button onClick={() => navigate('/')}>Go to home</Button>}
      />
    </div>
  );
}
