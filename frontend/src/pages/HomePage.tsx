import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	Container,
	Title,
	Button,
	Table,
	Image,
	Text,
	Group,
	Badge,
	Loader,
	Alert,
	Stack,
} from '@mantine/core';
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

	if (loading) return <Loader style={{ display: 'block', margin: '80px auto' }} />;
	if (error)
		return (
			<Alert color="red" title="Error" m="xl">
				{error}
			</Alert>
		);

	return (
		<Container size="lg" py="xl">
			<Group justify="space-between" mb="xl">
				<Title order={1}>MusicLink Analytics</Title>
				<Button onClick={() => navigate('/create')}>+ New MusicLink</Button>
			</Group>

			{links.length === 0 ? (
				<Text c="dimmed" ta="center" mt="xl">
					No MusicLinks yet. Create your first one!
				</Text>
			) : (
				<Table striped highlightOnHover>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Track</Table.Th>
							<Table.Th>Artist</Table.Th>
							<Table.Th>Created</Table.Th>
							<Table.Th>Views</Table.Th>
							<Table.Th>Clicks</Table.Th>
							<Table.Th>Actions</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{links.map((link) => (
							<Table.Tr key={link.id}>
								<Table.Td>
									<Group gap="sm">
										{link.coverUrl && <Image src={link.coverUrl} w={40} h={40} radius="sm" />}
										<Text fw={500}>{link.name}</Text>
									</Group>
								</Table.Td>
								<Table.Td>{link.artist}</Table.Td>
								<Table.Td>{new Date(link.created_at).toLocaleDateString()}</Table.Td>
								<Table.Td>
									<Badge variant="light">{link.views}</Badge>
								</Table.Td>
								<Table.Td>
									<Badge variant="light" color="green">
										{link.clicks}
									</Badge>
								</Table.Td>
								<Table.Td>
									<Stack gap={4}>
										<Button
											size="xs"
											variant="subtle"
											onClick={() => navigate(`/music-link/${link.id}`)}
										>
											Open
										</Button>
										<Button
											size="xs"
											variant="subtle"
											color="grape"
											onClick={() => navigate(`/music-link/${link.id}/report`)}
										>
											Report
										</Button>
									</Stack>
								</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			)}
		</Container>
	);
}
