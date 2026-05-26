import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { router } from './router';

const theme = createTheme({
	primaryColor: 'customRed',
	defaultRadius: 'md',
	fontFamily: "'Lexend', system-ui, sans-serif",
	fontFamilyMonospace: "'Lexend', monospace",
	headings: { fontFamily: "'Lexend', system-ui, sans-serif", fontWeight: '500' },
	fontSizes: {
		xs: '0.6rem',
		sm: '0.75rem',
		md: '0.9rem',
		lg: '1rem',
		xl: '1.2rem',
	},
	colors: {
		customRed: [
			'#E03325',
			'#FF5050',
			'#f4aea7',
			'#ec8078',
			'#e55b50',
			'#e14336',
			'#e03628',
			'#c8281b',
			'#b22017',
			'#9d1511',
		],
		dark: [
			'#c9c9c9',
			'#b8b8b8',
			'#828282',
			'#696969',
			'#424242',
			'#3b3b3b',
			'#2e2e2e',
			'#242424',
			'#1f1f1f',
			'#141414',
		],
	},
	components: {
		Card: {
			defaultProps: { radius: 'md' },
			styles: {
				root: {
					backgroundColor: '#242424',
					border: '1px solid rgba(255,255,255,0.1)',
				},
			},
		},
		Button: {
			defaultProps: { color: 'customRed', radius: 'md' },
		},
		TextInput: {
			styles: {
				input: {
					backgroundColor: 'rgba(255,255,255,0.05)',
					border: '1px solid rgba(255,255,255,0.1)',
					borderRadius: '10px',
				},
			},
		},
	},
});

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<MantineProvider defaultColorScheme="dark" theme={theme}>
			<Notifications />
			<RouterProvider router={router} />
		</MantineProvider>
	</React.StrictMode>,
);
