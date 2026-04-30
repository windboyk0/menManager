import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useProjectHistory } from '../../hooks/useProjects'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'
import type { ProjectHistory } from '../../types/project'

function eventBadge(type: 'INSERT' | 'UPDATE' | 'DELETE') {
  switch (type) {
    case 'INSERT': return <Badge variant="success">생성</Badge>
    case 'UPDATE': return <Badge variant="secondary">수정</Badge>
    case 'DELETE': return <Badge variant="destructive">삭제</Badge>
  }
}

function ChangesSummary({ h }: { h: ProjectHistory }) {
  if (h.event_type === 'INSERT' && h.new_values) {
    return (
      <div className="text-sm space-y-0.5">
        {Object.entries(h.new_values).map(([k, v]) => (
          <div key={k}><span className="text-muted-foreground">{k}:</span> {v ?? '-'}</div>
        ))}
      </div>
    )
  }
  if (h.event_type === 'DELETE' && h.old_values) {
    return (
      <div className="text-sm space-y-0.5">
        {Object.entries(h.old_values).map(([k, v]) => (
          <div key={k}><span className="text-muted-foreground">{k}:</span> {v ?? '-'}</div>
        ))}
      </div>
    )
  }
  if (h.event_type === 'UPDATE' && h.old_values && h.new_values) {
    return (
      <div className="text-sm space-y-0.5">
        {Object.keys(h.new_values).map(k => (
          <div key={k}>
            <span className="text-muted-foreground">{k}:</span>{' '}
            <span className="line-through text-muted-foreground">{h.old_values![k] ?? '-'}</span>
            {' → '}
            <span>{h.new_values![k] ?? '-'}</span>
          </div>
        ))}
      </div>
    )
  }
  return <span className="text-muted-foreground">-</span>
}

export function ProjectHistoryPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: history, isLoading } = useProjectHistory(id ?? '')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${id}`)}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          프로젝트 상세
        </Button>
        <h1 className="text-2xl font-bold">프로젝트 변경이력</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>변경 이력 — {id}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 text-center text-muted-foreground">불러오는 중...</div>
          ) : !history?.length ? (
            <div className="py-16 text-center text-muted-foreground">이력이 없습니다.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>변경일시</TableHead>
                  <TableHead>이벤트</TableHead>
                  <TableHead>변경 내용</TableHead>
                  <TableHead>변경자</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map(h => (
                  <TableRow key={h.id}>
                    <TableCell className="text-sm whitespace-nowrap align-top">{new Date(h.changed_at).toLocaleString('ko-KR')}</TableCell>
                    <TableCell className="align-top">{eventBadge(h.event_type)}</TableCell>
                    <TableCell className="align-top"><ChangesSummary h={h} /></TableCell>
                    <TableCell className="align-top">{h.changed_by}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
