import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Title, Text, Image, Button, Stack, Loader, Alert, Center } from '@mantine/core';
import {
	IconBrandSpotify,
	IconBrandApple,
	IconBrandDeezer,
	IconBrandYoutube,
	IconBrandSoundcloud,
} from '@tabler/icons-react';
import { musicLinksApi } from '../api/musicLinks';
import { eventsApi } from '../api/events';
import type { MusicLink } from '../types';

const PLATFORM_LABELS: Record<string, string> = {
	spotify_url: 'Spotify',
	apple_music_url: 'Apple Music',
	deezer_url: 'Deezer',
	youtube_url: 'YouTube',
	soundcloud_url: 'SoundCloud',
};

const PLATFORM_COLORS: Record<string, string> = {
	spotify_url: 'green',
	apple_music_url: 'pink',
	deezer_url: 'violet',
	youtube_url: 'red',
	soundcloud_url: 'orange',
};

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
	spotify_url: <IconBrandSpotify size={20} />,
	apple_music_url: <IconBrandApple size={20} />,
	deezer_url: <IconBrandDeezer size={20} />,
	youtube_url: <IconBrandYoutube size={20} />,
	soundcloud_url: <IconBrandSoundcloud size={20} />,
};

const PLATFORM_KEY_MAP: Record<string, string> = {
	spotify_url: 'spotify',
	apple_music_url: 'apple_music',
	deezer_url: 'deezer',
	youtube_url: 'youtube',
	soundcloud_url: 'soundcloud',
};

export function PublicPage() {
	const { id } = useParams<{ id: string }>();
	const [link, setLink] = useState<MusicLink | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!id) return;
		musicLinksApi
			.get(id)
			.then((data) => {
				setLink(data);
				eventsApi.trackView(id).catch((err) => console.error('[tracking] trackView failed:', err));
			})
			.catch((e: Error) => setError(e.message))
			.finally(() => setLoading(false));
	}, [id]);

	if (loading)
		return (
			<Center h="100vh">
				<Loader />
			</Center>
		);
	if (error || !link)
		return (
			<Alert color="red" m="xl">
				{error ?? 'Not found'}
			</Alert>
		);

	const platforms = (
		['spotify_url', 'apple_music_url', 'deezer_url', 'youtube_url', 'soundcloud_url'] as const
	).filter((key) => link[key]);

	function handlePlatformClick(urlKey: string) {
		const url = link![urlKey as keyof MusicLink] as string;
		eventsApi
			.trackClick(link!.id, PLATFORM_KEY_MAP[urlKey])
			.catch((err) => console.error('[tracking] trackClick failed:', err));
		window.open(url, '_blank', 'noopener,noreferrer');
	}

	return (
		<Center mih="100vh" style={{ position: 'relative', overflow: 'hidden', background: '#0a0a0a' }}>
			{/* Blurred album art background */}
			{link.coverUrl && (
				<div
					style={{
						position: 'absolute',
						inset: '-40px',
						backgroundImage: `url(${link.coverUrl})`,
						backgroundSize: 'cover',
						backgroundPosition: 'center',
						filter: 'blur(60px) saturate(1.4) brightness(0.45)',
						transform: 'scale(1.1)',
						zIndex: 0,
					}}
				/>
			)}
			{/* Grain overlay */}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					zIndex: 1,
					opacity: 0.18,
					backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
					backgroundRepeat: 'repeat',
					backgroundSize: '128px 128px',
					pointerEvents: 'none',
				}}
			/>
			{/* Dark vignette */}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					zIndex: 2,
					background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.65) 100%)',
					pointerEvents: 'none',
				}}
			/>
			<Container size="xs" py="xl" style={{ position: 'relative', zIndex: 3 }}>
				<Stack align="center" gap="xl">
					{link.coverUrl && (
						<Image
							src={link.coverUrl}
							w={240}
							h={240}
							radius="md"
							style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
						/>
					)}
					<Stack align="center" gap={4}>
						<Title order={2} c="white" ta="center">
							{link.name}
						</Title>
						<Text c="gray.4" size="lg">
							{link.artist}
						</Text>
					</Stack>
					<Stack w="100%" gap="sm">
						{platforms.map((urlKey) => (
							<Button
								key={urlKey}
								fullWidth
								size="md"
								color={PLATFORM_COLORS[urlKey]}
								leftSection={PLATFORM_ICONS[urlKey]}
								onClick={() => handlePlatformClick(urlKey)}
							>
								Listen on {PLATFORM_LABELS[urlKey]}
							</Button>
						))}
					</Stack>
					{platforms.length === 0 && <Text c="gray.5">No platform links available.</Text>}
				</Stack>
			</Container>
		</Center>
	);
}
