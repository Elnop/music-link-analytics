import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	Container,
	Title,
	TextInput,
	Button,
	Card,
	Image,
	Text,
	Group,
	Loader,
	Alert,
	Stack,
	Badge,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { searchApi } from '../api/search';
import { musicLinksApi } from '../api/musicLinks';
import type { SpotifyTrackResult } from '../types';

export function CreatePage() {
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<SpotifyTrackResult[]>([]);
	const [searching, setSearching] = useState(false);
	const [creating, setCreating] = useState(false);
	const [searchError, setSearchError] = useState<string | null>(null);
	const [hasSearched, setHasSearched] = useState(false);
	const navigate = useNavigate();

	async function handleSearch() {
		if (!query.trim()) return;
		setSearching(true);
		setSearchError(null);
		try {
			const tracks = await searchApi.spotify(query);
			setResults(tracks);
			setHasSearched(true);
		} catch (e: unknown) {
			setSearchError(e instanceof Error ? e.message : 'Search failed');
		} finally {
			setSearching(false);
		}
	}

	async function handleSelect(track: SpotifyTrackResult) {
		setCreating(true);
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
			notifications.show({
				title: 'Error',
				message: e instanceof Error ? e.message : 'Creation failed',
				color: 'red',
			});
		} finally {
			setCreating(false);
		}
	}

	return (
		<Container size="md" py="xl">
			<Button variant="subtle" mb="md" onClick={() => navigate('/')}>
				← Back
			</Button>
			<Title order={2} mb="xl">
				Create a new MusicLink
			</Title>

			<Group mb="md">
				<TextInput
					flex={1}
					placeholder="Search a track (e.g. Daft Punk, Bohemian Rhapsody...)"
					value={query}
					onChange={(e) => setQuery(e.currentTarget.value)}
					onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
				/>
				<Button onClick={handleSearch} loading={searching}>
					Search
				</Button>
			</Group>

			{searchError && (
				<Alert color="red" mb="md">
					{searchError}
				</Alert>
			)}

			{creating && (
				<Group justify="center" py="xl">
					<Loader />
					<Text>Creating MusicLink...</Text>
				</Group>
			)}

			{hasSearched && !searching && results.length === 0 && !searchError && (
				<Text c="dimmed" ta="center" py="xl">
					No tracks found for "{query}".
				</Text>
			)}

			<Stack gap="sm">
				{results.map((track) => (
					<Card
						key={track.id}
						withBorder
						padding="sm"
						style={{ cursor: 'pointer' }}
						onClick={() => !creating && handleSelect(track)}
					>
						<Group>
							<Image src={track.coverUrl ?? ''} w={56} h={56} radius="sm" />
							<Stack gap={2} flex={1}>
								<Text fw={600}>{track.name}</Text>
								<Text size="sm" c="dimmed">
									{track.artist}
								</Text>
							</Stack>
							<Badge variant="outline">
								{Math.floor(track.durationMs / 60000)}:
								{String(Math.floor((track.durationMs % 60000) / 1000)).padStart(2, '0')}
							</Badge>
						</Group>
					</Card>
				))}
			</Stack>
		</Container>
	);
}
