import { createBrowserRouter } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { CreatePage } from './pages/CreatePage';
import { PublicPage } from './pages/PublicPage';
import { ReportPage } from './pages/ReportPage';

export const router = createBrowserRouter([
	{ path: '/', element: <HomePage /> },
	{ path: '/create', element: <CreatePage /> },
	{ path: '/music-link/:id', element: <PublicPage /> },
	{ path: '/music-link/:id/report', element: <ReportPage /> },
]);
