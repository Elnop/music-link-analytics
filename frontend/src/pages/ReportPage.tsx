import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
	Box,
	Container,
	Title,
	Text,
	Button,
	Grid,
	Loader,
	Alert,
	Stack,
	Center,
	Group,
} from '@mantine/core';
import {
	AreaChart,
	Area,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from 'recharts';
import { musicLinksApi } from '../api/musicLinks';
import type { AnalyticsReport } from '../types';

const PLATFORM_COLORS: Record<string, string> = {
	spotify: '#1DB954',
	apple_music: '#fc3c44',
	deezer: '#a238ff',
	youtube: '#FF0000',
	soundcloud: '#ff5500',
};

export function ReportPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [report, setReport] = useState<AnalyticsReport | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!id) return;
		musicLinksApi
			.report(id)
			.then(setReport)
			.catch((e: Error) => setError(e.message))
			.finally(() => setLoading(false));
	}, [id]);

	if (loading)
		return (
			<Center h="100vh">
				<Loader color="customRed" />
			</Center>
		);
	if (error || !report)
		return (
			<Alert color="red" m="xl">
				{error ?? 'Failed to load report'}
			</Alert>
		);

	const viewsData = Object.entries(report.viewsByDay)
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([day, count]) => ({ day, views: count }));

	const platformData = Object.entries(report.clicksByPlatform).map(([platform, count]) => ({
		platform,
		clicks: count,
	}));

	const kpiCards = [
		{
			label: 'Total Views',
			value: report.totalViews,
			border: 'rgba(134, 138, 250, 0.4)',
			bg: 'rgba(134, 138, 250, 0.08)',
		},
		{
			label: 'Total Clicks',
			value: report.totalClicks,
			border: 'rgba(64, 192, 87, 0.4)',
			bg: 'rgba(64, 192, 87, 0.08)',
		},
		{
			label: 'Click Rate',
			value: `${report.clickRate}%`,
			border: 'rgba(224, 54, 40, 0.4)',
			bg: 'rgba(224, 54, 40, 0.08)',
		},
	];

	return (
		<Box style={{ background: 'var(--glow-indigo)', minHeight: '100vh' }}>
			<Container size="lg" py="xl">
				<Button variant="subtle" color="gray" mb="md" onClick={() => navigate('/')}>
					← Back
				</Button>
				<Title order={2} fw={500} c="white" mb="xl">
					Analytics Report
				</Title>

				<Grid mb="xl">
					{kpiCards.map(({ label, value, border, bg }) => (
						<Grid.Col key={label} span={4}>
							<Box
								ta="center"
								p="lg"
								style={{
									backgroundColor: bg,
									border: `1px solid ${border}`,
									borderRadius: '10px',
								}}
							>
								<Text size="2rem" fw={600} c="white" lh={1.2}>
									{value}
								</Text>
								<Text size="sm" c="dimmed" mt={4}>
									{label}
								</Text>
							</Box>
						</Grid.Col>
					))}
				</Grid>

				<Stack gap="xl">
					{viewsData.length > 0 && (
						<Box
							p="lg"
							style={{
								backgroundColor: '#242424',
								border: '1px solid rgba(255,255,255,0.1)',
								borderRadius: '10px',
							}}
						>
							<Title order={4} fw={500} c="white" mb="md">
								Views over time
							</Title>
							<ResponsiveContainer width="100%" height={250}>
								<AreaChart data={viewsData}>
									<defs>
										<linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
											<stop offset="5%" stopColor="#868afa" stopOpacity={0.3} />
											<stop offset="95%" stopColor="#868afa" stopOpacity={0} />
										</linearGradient>
									</defs>
									<CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
									<XAxis dataKey="day" tick={{ fill: '#828282', fontSize: 11 }} axisLine={false} tickLine={false} />
									<YAxis allowDecimals={false} tick={{ fill: '#828282', fontSize: 11 }} axisLine={false} tickLine={false} />
									<Tooltip
										contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
										labelStyle={{ color: '#fff' }}
										itemStyle={{ color: '#868afa' }}
									/>
									<Area
										type="monotone"
										dataKey="views"
										stroke="#868afa"
										fill="url(#viewsGrad)"
										strokeWidth={2}
										dot={false}
									/>
								</AreaChart>
							</ResponsiveContainer>
						</Box>
					)}

					{platformData.length > 0 && (
						<Box
							p="lg"
							style={{
								backgroundColor: '#242424',
								border: '1px solid rgba(255,255,255,0.1)',
								borderRadius: '10px',
							}}
						>
							<Title order={4} fw={500} c="white" mb="md">
								Clicks by platform
							</Title>
							<ResponsiveContainer width="100%" height={250}>
								<BarChart data={platformData}>
									<defs>
										<linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
											<stop offset="0%" stopColor="#e03628" stopOpacity={1} />
											<stop offset="100%" stopColor="#e03628" stopOpacity={0.6} />
										</linearGradient>
									</defs>
									<CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
									<XAxis dataKey="platform" tick={{ fill: '#828282', fontSize: 11 }} axisLine={false} tickLine={false} />
									<YAxis allowDecimals={false} tick={{ fill: '#828282', fontSize: 11 }} axisLine={false} tickLine={false} />
									<Tooltip
										contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
										labelStyle={{ color: '#fff' }}
										itemStyle={{ color: '#e03628' }}
									/>
									<Bar dataKey="clicks" fill="url(#barGrad)" radius={[4, 4, 0, 0]} />
								</BarChart>
							</ResponsiveContainer>

							<Stack gap="xs" mt="md">
								{platformData.map(({ platform, clicks }) => (
									<Group key={platform} justify="space-between" px="xs">
										<Group gap="xs">
											<Box
												style={{
													width: 8,
													height: 8,
													borderRadius: '50%',
													backgroundColor: PLATFORM_COLORS[platform] ?? '#828282',
													flexShrink: 0,
												}}
											/>
											<Text size="sm" c="dimmed" style={{ textTransform: 'capitalize' }}>
												{platform.replace('_', ' ')}
											</Text>
										</Group>
										<Text size="sm" c="white" fw={500}>
											{clicks}
										</Text>
									</Group>
								))}
							</Stack>
						</Box>
					)}

					{platformData.length === 0 && viewsData.length === 0 && (
						<Center py="xl">
							<Text c="dimmed" ta="center">
								No analytics data yet. Share the MusicLink to start collecting data.
							</Text>
						</Center>
					)}
				</Stack>
			</Container>
		</Box>
	);
}
