import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container, Title, Text, Group, Button, Grid, Card,
  Table, Loader, Alert, Stack
} from '@mantine/core'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { musicLinksApi } from '../api/musicLinks'
import type { AnalyticsReport } from '../types'

export function ReportPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [report, setReport] = useState<AnalyticsReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    musicLinksApi.report(id)
      .then(setReport)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <Loader style={{ display: 'block', margin: '80px auto' }} />
  if (error || !report) return <Alert color="red" m="xl">{error ?? 'Failed to load report'}</Alert>

  const viewsData = Object.entries(report.viewsByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, count]) => ({ day, views: count }))

  const platformData = Object.entries(report.clicksByPlatform).map(([platform, count]) => ({
    platform,
    clicks: count,
  }))

  return (
    <Container size="lg" py="xl">
      <Button variant="subtle" mb="md" onClick={() => navigate('/')}>← Back</Button>
      <Title order={2} mb="xl">Analytics Report</Title>

      <Grid mb="xl">
        {[
          { label: 'Total Views', value: report.totalViews, color: 'blue' },
          { label: 'Total Clicks', value: report.totalClicks, color: 'green' },
          { label: 'Click Rate', value: `${report.clickRate}%`, color: 'grape' },
        ].map(({ label, value, color }) => (
          <Grid.Col key={label} span={4}>
            <Card withBorder ta="center" p="lg">
              <Text size="xl" fw={700} c={color}>{value}</Text>
              <Text size="sm" c="dimmed">{label}</Text>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      <Stack gap="xl">
        {viewsData.length > 0 && (
          <Card withBorder p="lg">
            <Title order={4} mb="md">Views over time</Title>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={viewsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="views" stroke="#228be6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {platformData.length > 0 && (
          <Card withBorder p="lg">
            <Title order={4} mb="md">Clicks by platform</Title>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="platform" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="clicks" fill="#40c057" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <Table mt="md" striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Platform</Table.Th>
                  <Table.Th>Clicks</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {platformData.map(({ platform, clicks }) => (
                  <Table.Tr key={platform}>
                    <Table.Td>{platform}</Table.Td>
                    <Table.Td>{clicks}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        )}

        {platformData.length === 0 && viewsData.length === 0 && (
          <Text c="dimmed" ta="center">No analytics data yet. Share the MusicLink to start collecting data.</Text>
        )}
      </Stack>
    </Container>
  )
}
