import AppRouter from './routes/index';
import AppErrorBoundary from './components/common/AppErrorBoundary';

export default function App() {
  return (
    <AppErrorBoundary>
      <AppRouter />
    </AppErrorBoundary>
  );
}
