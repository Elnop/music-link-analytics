import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IconArrowLeft } from '@tabler/icons-react';
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
	SegmentedControl,
} from '@mantine/core';
import {
	AreaChart,
	Area,
	BarChart,
	Bar,
	LineChart,
	Line,
	Cell,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from 'recharts';
import { musicLinksApi } from '../api/musicLinks';
import type { AnalyticsReport, Granularity } from '../types';

const PLATFORM_COLORS: Record<string, string> = {
	spotify: '#1DB954',
	apple_music: '#fc3c44',
	deezer: '#a238ff',
	youtube: '#FF0000',
	soundcloud: '#ff5500',
};

const GRANULARITY_LABELS: Record<Granularity, string> = {
	hour: 'Heure',
	day: 'Jour',
	week: 'Semaine',
	year: 'Année',
	all: 'Tout',
};

const CHART_STYLE = {
	backgroundColor: '#242424',
	border: '1px solid rgba(255,255,255,0.1)',
	borderRadius: '10px',
};

const TOOLTIP_STYLE = {
	contentStyle: {
		backgroundColor: '#1f1f1f',
		border: '1px solid rgba(255,255,255,0.1)',
		borderRadius: 8,
	},
	labelStyle: { color: '#fff' },
};

function formatPeriodLabel(period: string, granularity: Granularity): string {
	if (granularity === 'all') return 'Total';
	if (granularity === 'hour') {
		// "YYYY-MM-DD HH" → "DD/MM HH h"
		const [datePart, hour] = period.split(' ');
		if (!datePart || !hour) return period;
		const [, month, day] = datePart.split('-');
		return `${day}/${month} ${hour}h`;
	}
	if (granularity === 'day') {
		// "YYYY-MM-DD" → "DD/MM"
		const parts = period.split('-');
		return `${parts[2]}/${parts[1]}`;
	}
	if (granularity === 'week') {
		// "YYYY-Www" → "S{ww} YYYY"
		const [year, week] = period.split('-W');
		return `S${week} ${year}`;
	}
	return period;
}

export function ReportPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [granularity, setGranularity] = useState<Granularity>('day');
	const [report, setReport] = useState<AnalyticsReport | null>(null);
	const [fetchedGranularity, setFetchedGranularity] = useState<Granularity | null>(null);
	const [error, setError] = useState<string | null>(null);

	const loading = fetchedGranularity !== granularity && !error;

	useEffect(() => {
		if (!id) return;
		musicLinksApi
			.report(id, granularity)
			.then((data) => {
				setReport(data);
				setFetchedGranularity(granularity);
			})
			.catch((e: Error) => {
				setError(e.message);
			});
	}, [id, granularity]);

	if (error)
		return (
			<Alert color="red" m="xl">
				{error}
			</Alert>
		);

	const kpiCards = report
		? [
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
			]
		: [];

	const reportGranularity = report?.granularity ?? granularity;

	const viewsData = report
		? Object.entries(report.viewsByDay)
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([period, count]) => ({
					period: formatPeriodLabel(period, reportGranularity),
					views: count,
				}))
		: [];

	const clicksData = report
		? Object.entries(report.clicksByDay)
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([period, count]) => ({
					period: formatPeriodLabel(period, reportGranularity),
					clicks: count,
				}))
		: [];

	const platformData = report
		? Object.entries(report.clicksByPlatform).map(([platform, count]) => ({
				platform,
				clicks: count,
			}))
		: [];

	const allPlatforms = report ? Object.keys(report.clicksByPlatform) : [];

	const platformOverTimeData = report
		? Object.entries(report.clicksByPlatformOverTime)
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([period, byPlatform]) => ({
					period: formatPeriodLabel(period, reportGranularity),
					...byPlatform,
				}))
		: [];

	const hasData = report && (viewsData.length > 0 || platformData.length > 0);

	return (
		<Box style={{ background: 'var(--glow-indigo)', minHeight: '100vh' }}>
			<Container size="lg" py="xl">
				<Button
					variant="subtle"
					color="gray"
					mb="md"
					leftSection={<IconArrowLeft size={16} />}
					onClick={() => navigate('/')}
				>
					Back
				</Button>
				<Title order={2} fw={500} c="white" mb="xl">
					Analytics Report
				</Title>

				{report && (
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
				)}

				<Group justify="space-between" align="center" mb="lg">
					<Text c="dimmed" size="sm">
						Granularité
					</Text>
					<SegmentedControl
						value={granularity}
						onChange={(v) => setGranularity(v as Granularity)}
						data={Object.entries(GRANULARITY_LABELS).map(([value, label]) => ({
							value,
							label,
						}))}
						styles={{
							root: { backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' },
							label: { color: '#828282', fontSize: 13 },
							indicator: { backgroundColor: '#2c2c2c' },
						}}
					/>
				</Group>

				{loading ? (
					<Center py="xl">
						<Loader color="customRed" />
					</Center>
				) : !hasData ? (
					<Center py="xl">
						<Text c="dimmed" ta="center">
							No analytics data yet. Share the MusicLink to start collecting data.
						</Text>
					</Center>
				) : (
					<Stack gap="xl">
						{viewsData.length > 0 && (
							<Box p="lg" style={CHART_STYLE}>
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
										<XAxis
											dataKey="period"
											tick={{ fill: '#828282', fontSize: 11 }}
											axisLine={false}
											tickLine={false}
										/>
										<YAxis
											allowDecimals={false}
											tick={{ fill: '#828282', fontSize: 11 }}
											axisLine={false}
											tickLine={false}
										/>
										<Tooltip {...TOOLTIP_STYLE} itemStyle={{ color: '#868afa' }} />
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

						{clicksData.length > 0 && (
							<Box p="lg" style={CHART_STYLE}>
								<Title order={4} fw={500} c="white" mb="md">
									Clicks over time
								</Title>
								<ResponsiveContainer width="100%" height={250}>
									<AreaChart data={clicksData}>
										<defs>
											<linearGradient id="clicksGrad" x1="0" y1="0" x2="0" y2="1">
												<stop offset="5%" stopColor="#40c057" stopOpacity={0.3} />
												<stop offset="95%" stopColor="#40c057" stopOpacity={0} />
											</linearGradient>
										</defs>
										<CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
										<XAxis
											dataKey="period"
											tick={{ fill: '#828282', fontSize: 11 }}
											axisLine={false}
											tickLine={false}
										/>
										<YAxis
											allowDecimals={false}
											tick={{ fill: '#828282', fontSize: 11 }}
											axisLine={false}
											tickLine={false}
										/>
										<Tooltip {...TOOLTIP_STYLE} itemStyle={{ color: '#40c057' }} />
										<Area
											type="monotone"
											dataKey="clicks"
											stroke="#40c057"
											fill="url(#clicksGrad)"
											strokeWidth={2}
											dot={false}
										/>
									</AreaChart>
								</ResponsiveContainer>
							</Box>
						)}

						{platformOverTimeData.length > 0 && allPlatforms.length > 0 && (
							<Box p="lg" style={CHART_STYLE}>
								<Title order={4} fw={500} c="white" mb="md">
									Clicks par plateforme dans le temps
								</Title>
								<ResponsiveContainer width="100%" height={280}>
									<LineChart data={platformOverTimeData}>
										<CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
										<XAxis
											dataKey="period"
											tick={{ fill: '#828282', fontSize: 11 }}
											axisLine={false}
											tickLine={false}
										/>
										<YAxis
											allowDecimals={false}
											tick={{ fill: '#828282', fontSize: 11 }}
											axisLine={false}
											tickLine={false}
										/>
										<Tooltip {...TOOLTIP_STYLE} />
										<Legend
											wrapperStyle={{ color: '#828282', fontSize: 12, paddingTop: 12 }}
											formatter={(value) => value.replace('_', ' ')}
										/>
										{allPlatforms.map((platform) => (
											<Line
												key={platform}
												type="monotone"
												dataKey={platform}
												stroke={PLATFORM_COLORS[platform] ?? '#828282'}
												strokeWidth={2}
												dot={false}
												activeDot={{ r: 4 }}
											/>
										))}
									</LineChart>
								</ResponsiveContainer>
							</Box>
						)}

						{platformData.length > 0 && (
							<Box p="lg" style={CHART_STYLE}>
								<Title order={4} fw={500} c="white" mb="md">
									Clicks par plateforme (total)
								</Title>
								<ResponsiveContainer width="100%" height={250}>
									<BarChart data={platformData}>
										<CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
										<XAxis
											dataKey="platform"
											tick={{ fill: '#828282', fontSize: 11 }}
											axisLine={false}
											tickLine={false}
											tickFormatter={(v: string) => v.replace('_', ' ')}
										/>
										<YAxis
											allowDecimals={false}
											tick={{ fill: '#828282', fontSize: 11 }}
											axisLine={false}
											tickLine={false}
										/>
										<Tooltip
											{...TOOLTIP_STYLE}
											formatter={(value: number, name: string) => [value, name.replace('_', ' ')]}
										/>
										<Bar dataKey="clicks" radius={[4, 4, 0, 0]}>
											{platformData.map(({ platform }) => (
												<Cell key={platform} fill={PLATFORM_COLORS[platform] ?? '#828282'} />
											))}
										</Bar>
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
					</Stack>
				)}
			</Container>
		</Box>
	);
}
