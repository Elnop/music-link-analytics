import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	server: {
		proxy: {
			'/api': 'http://localhost:3001',
			'/music-link': {
				target: 'http://localhost:3001',
				changeOrigin: true,
				bypass(req) {
					// Only proxy if the request looks like a crawler
					const ua = req.headers['user-agent'] ?? '';
					const crawlerPatterns = [
						'twitterbot', 'facebookexternalhit', 'linkedinbot', 'telegrambot',
						'whatsapp', 'slackbot', 'discordbot', 'imessage', 'googlebot',
						'bingbot', 'curl', 'python-requests', 'go-http-client',
					];
					const isCrawler = crawlerPatterns.some((p) => ua.toLowerCase().includes(p));
					if (!isCrawler) return req.url; // bypass proxy, serve index.html
					return null; // forward to backend
				},
			},
		},
	},
});
