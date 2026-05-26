import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Container, Title, Text, Image, Button, Stack, Loader, Alert, Center
} from '@mantine/core'
import { musicLinksApi } from '../api/musicLinks'
import { eventsApi } from '../api/events'
import type { MusicLink } from '../types'

const PLATFORM_LABELS: Record<string, string> = {
  spotify_url: 'Spotify',
  apple_music_url: 'Apple Music',
  deezer_url: 'Deezer',
  youtube_url: 'YouTube',
  soundcloud_url: 'SoundCloud',
}

const PLATFORM_COLORS: Record<string, string> = {
  spotify_url: 'green',
  apple_music_url: 'pink',
  deezer_url: 'violet',
  youtube_url: 'red',
  soundcloud_url: 'orange',
}

const PLATFORM_KEY_MAP: Record<string, string> = {
  spotify_url: 'spotify',
  apple_music_url: 'apple_music',
  deezer_url: 'deezer',
  youtube_url: 'youtube',
  soundcloud_url: 'soundcloud',
}

export function PublicPage() {
  const { id } = useParams<{ id: string }>()
  const [link, setLink] = useState<MusicLink | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    musicLinksApi.get(id)
      .then((data) => {
        setLink(data)
        eventsApi.trackView(id).catch(() => {})
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <Center h="100vh"><Loader /></Center>
  if (error || !link) return <Alert color="red" m="xl">{error ?? 'Not found'}</Alert>

  const platforms = (
    ['spotify_url', 'apple_music_url', 'deezer_url', 'youtube_url', 'soundcloud_url'] as const
  ).filter((key) => link[key])

  function handlePlatformClick(urlKey: string) {
    const url = link![urlKey as keyof MusicLink] as string
    eventsApi.trackClick(link!.id, PLATFORM_KEY_MAP[urlKey]).catch(() => {})
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <Center mih="100vh" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
      <Container size="xs" py="xl">
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
            <Title order={2} c="white" ta="center">{link.name}</Title>
            <Text c="gray.4" size="lg">{link.artist}</Text>
          </Stack>
          <Stack w="100%" gap="sm">
            {platforms.map((urlKey) => (
              <Button
                key={urlKey}
                fullWidth
                size="md"
                color={PLATFORM_COLORS[urlKey]}
                onClick={() => handlePlatformClick(urlKey)}
              >
                Listen on {PLATFORM_LABELS[urlKey]}
              </Button>
            ))}
          </Stack>
          {platforms.length === 0 && (
            <Text c="gray.5">No platform links available.</Text>
          )}
        </Stack>
      </Container>
    </Center>
  )
}
