import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export default function IndexScreen() {
  // Show loading while router initializes
  return <LoadingSpinner text="Loading..." />;
}