import {createRoot} from 'react-dom/client';
import {SaveAccessPage} from './components/SaveAccessPage/SaveAccessPage';
import {useSaveAccess} from './hooks/useSaveAccess';

function App() {
  return <SaveAccessPage {...useSaveAccess()} />;
}

const root = document.getElementById('root');
if (!root) throw new Error('App root is missing');
createRoot(root).render(<App />);
