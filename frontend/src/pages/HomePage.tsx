import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	Box,
	Container,
	Title,
	Button,
	Image,
	Text,
	Group,
	Badge,
	Loader,
	Alert,
	Stack,
	Center,
} from '@mantine/core';
import { IconMusic } from '@tabler/icons-react';
import { musicLinksApi } from '../api/musicLinks';
import type { MusicLink } from '../types';

export function HomePage() {
	const [links, setLinks] = useState<MusicLink[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate();

	useEffect(() => {
		musicLinksApi
			.list()
			.then(setLinks)
			.catch((e: Error) => setError(e.message))
			.finally(() => setLoading(false));
	}, []);

	if (loading)
		return (
			<Center h="100vh">
				<Loader color="customRed" />
			</Center>
		);
	if (error)
		return (
			<Alert color="red" title="Error" m="xl">
				{error}
			</Alert>
		);

	return (
		<Box style={{ background: 'var(--glow-indigo)', minHeight: '100vh' }}>
			<Container size="lg" py="xl">
				<Group justify="space-between" mb="xl">
					<Stack gap={4}>
						<Title order={1} fw={500} c="white">
							MusicLink Analytics
						</Title>
						<Text c="dimmed" size="sm">
							Your music, everywhere
						</Text>
					</Stack>
					<Button color="customRed" radius="md" onClick={() => navigate('/create')}>
						+ New MusicLink
					</Button>
				</Group>

				{links.length === 0 ? (
					<Center py={80}>
						<Stack align="center" gap="md">
							<IconMusic size={48} color="rgba(255,255,255,0.2)" stroke={1.5} />
							<Text c="dimmed" ta="center">
								No MusicLinks yet.
							</Text>
							<Button color="customRed" radius="md" onClick={() => navigate('/create')}>
								Create your first one
							</Button>
						</Stack>
					</Center>
				) : (
					<Stack gap="sm">
						{links.map((link) => (
							<Box
								key={link.id}
								className="music-link-card"
								style={{
									backgroundColor: '#242424',
									border: '1px solid rgba(255,255,255,0.1)',
									borderRadius: '10px',
									padding: '16px 20px',
								}}
							>
								<Group justify="space-between" wrap="nowrap">
									<Group gap="md" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
										{link.coverUrl && (
											<Image
												src={link.coverUrl}
												w={56}
												h={56}
												radius="sm"
												style={{ flexShrink: 0 }}
											/>
										)}
										<Stack gap={2} style={{ minWidth: 0 }}>
											<Text fw={500} c="white" truncate>
												{link.name}
											</Text>
											<Text size="sm" c="dimmed" truncate>
												{link.artist}
											</Text>
											<Text size="xs" c="dimmed">
												{new Date(link.created_at).toLocaleDateString()}
											</Text>
										</Stack>
									</Group>
									<Group gap="lg" wrap="nowrap" style={{ flexShrink: 0 }}>
										<Stack gap={4} align="center">
											<Badge variant="light" color="blue" size="lg">
												{link.views}
											</Badge>
											<Text size="sm" c="dimmed">
												views
											</Text>
										</Stack>
										<Stack gap={4} align="center">
											<Badge variant="light" color="green" size="lg">
												{link.clicks}
											</Badge>
											<Text size="sm" c="dimmed">
												clicks
											</Text>
										</Stack>
										<Group gap="sm">
											<Button
												size="sm"
												variant="subtle"
												color="gray"
												onClick={() => navigate(`/music-link/${link.id}`)}
											>
												Open
											</Button>
											<Button
												size="sm"
												variant="subtle"
												color="blue"
												onClick={() => navigate(`/music-link/${link.id}/report`)}
											>
												Stats
											</Button>
										</Group>
									</Group>
								</Group>
							</Box>
						))}
					</Stack>
				)}
			</Container>
		</Box>
	);
}
