import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import {
	Box,
	Container,
	Title,
	TextInput,
	Button,
	Image,
	Text,
	Group,
	Loader,
	Alert,
	Stack,
	Center,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconSearch, IconArrowLeft } from '@tabler/icons-react';
import { searchApi } from '../api/search';
import { musicLinksApi } from '../api/musicLinks';
import type { SpotifyTrackResult } from '../types';

export function CreatePage() {
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<SpotifyTrackResult[]>([]);
	const [total, setTotal] = useState(0);
	const [offset, setOffset] = useState(0);
	const LIMIT = 10;
	const [searching, setSearching] = useState(false);
	const [creating, setCreating] = useState(false);
	const [creatingId, setCreatingId] = useState<string | null>(null);
	const [searchError, setSearchError] = useState<string | null>(null);
	const [hasSearched, setHasSearched] = useState(false);
	const navigate = useNavigate();

	async function fetchPage(pageOffset: number) {
		if (!query.trim()) return;
		setSearching(true);
		setSearchError(null);
		try {
			const data = await searchApi.spotify(query, pageOffset);
			setResults(data.results);
			setTotal(data.total);
			setOffset(pageOffset);
			setHasSearched(true);
		} catch (e: unknown) {
			setSearchError(e instanceof Error ? e.message : 'Search failed');
		} finally {
			setSearching(false);
		}
	}

	async function handleSearch() {
		setOffset(0);
		await fetchPage(0);
	}

	async function handleSelect(track: SpotifyTrackResult) {
		setCreating(true);
		setCreatingId(track.id);
		try {
			const platformLinks = await searchApi.similarTracks(track.id);
			const musicLink = await musicLinksApi.create({
				spotify_track_id: track.id,
				spotify_url: track.spotifyUrl,
				apple_music_url: platformLinks.apple_music_url,
				deezer_url: platformLinks.deezer_url,
				youtube_url: platformLinks.youtube_url,
				soundcloud_url: platformLinks.soundcloud_url,
			});
			notifications.show({ title: 'MusicLink created!', message: track.name, color: 'green' });
			navigate(`/music-link/${musicLink.id}`);
		} catch (e: unknown) {
			if (e instanceof ApiError && e.status === 409 && typeof e.data?.id === 'string') {
				notifications.show({
					title: 'Already exists',
					message: 'A music link for this track already exists.',
					color: 'yellow',
				});
				navigate(`/music-link/${e.data.id}`);
			} else {
				notifications.show({
					title: 'Error',
					message: e instanceof Error ? e.message : 'Creation failed',
					color: 'red',
				});
			}
		} finally {
			setCreating(false);
			setCreatingId(null);
		}
	}

	return (
		<Box style={{ background: 'var(--glow-indigo)', minHeight: '100vh' }}>
			<Container size="md" py="xl">
				<Button variant="subtle" color="gray" mb="md" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate('/')}>
					Back
				</Button>
				<Stack gap={4} mb="xl">
					<Title order={2} fw={500} c="white">
						Create a new MusicLink
					</Title>
					<Text c="dimmed" size="sm">
						Search a track and we'll find it on every platform.
					</Text>
				</Stack>

				<Group mb="md">
					<TextInput
						flex={1}
						size="lg"
						placeholder="Search a track (e.g. Daft Punk, Bohemian Rhapsody...)"
						value={query}
						onChange={(e) => setQuery(e.currentTarget.value)}
						onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
						leftSection={<IconSearch size={16} />}
					/>
					<Button size="lg" color="customRed" onClick={handleSearch} loading={searching}>
						Search
					</Button>
				</Group>

				{searchError && (
					<Alert color="red" mb="md">
						{searchError}
					</Alert>
				)}

				{hasSearched && !searching && results.length === 0 && !searchError && (
					<Text c="dimmed" ta="center" py="xl">
						No tracks found for "{query}".
					</Text>
				)}

				<Stack gap="sm">
					{results.map((track) => (
						<Box
							key={track.id}
							className="track-result-card"
							style={{
								backgroundColor: '#242424',
								border: '1px solid rgba(255,255,255,0.1)',
								borderRadius: '10px',
								padding: '14px 16px',
								cursor: creating ? 'default' : 'pointer',
								position: 'relative',
								overflow: 'hidden',
							}}
							onClick={() => !creating && handleSelect(track)}
						>
							<Group>
								<Image src={track.coverUrl ?? ''} w={64} h={64} radius="md" style={{ flexShrink: 0 }} />
								<Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
									<Text fw={500} c="white" truncate>
										{track.name}
									</Text>
									<Text size="sm" c="dimmed">
										{track.artist}
									</Text>
									<Text size="xs" c="dimmed">
										{Math.floor(track.durationMs / 60000)}:
										{String(Math.floor((track.durationMs % 60000) / 1000)).padStart(2, '0')}
									</Text>
								</Stack>
							</Group>
							{creatingId === track.id && (
								<Center
									style={{
										position: 'absolute',
										inset: 0,
										backgroundColor: 'rgba(0,0,0,0.6)',
										borderRadius: '10px',
									}}
								>
									<Loader color="customRed" size="sm" />
								</Center>
							)}
						</Box>
					))}
				</Stack>

				{hasSearched && total > LIMIT && (
					<Group justify="center" mt="md">
						<Button
							variant="subtle"
							color="gray"
							disabled={offset === 0 || searching}
							onClick={() => fetchPage(offset - LIMIT)}
						>
							Previous
						</Button>
						<Text c="dimmed" size="sm">
							{offset + 1}–{Math.min(offset + LIMIT, total)} of {total}
						</Text>
						<Button
							variant="subtle"
							color="gray"
							disabled={offset + LIMIT >= total || searching}
							onClick={() => fetchPage(offset + LIMIT)}
						>
							Next
						</Button>
					</Group>
				)}
			</Container>
		</Box>
	);
}
