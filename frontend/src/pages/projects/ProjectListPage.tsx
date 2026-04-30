import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { useProjects } from '../../hooks/useProjects'
import { useAuth } from '../../hooks/useAuth'
import type { Project } from '../../types/project'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'

type StatusFilter = 'all' | '진행중' | '완료' | '대기' | '취소'

function statusBadge(status: Project['status']) {
  switch (status) {
    case '진행중': return <Badge className="bg-blue-100 text-blue-800">진행중</Badge>
    case '완료': return <Badge variant="success">완료</Badge>
    case '대기': return <Badge variant="warning">대기</Badge>
    case '취소': return <Badge variant="destructive">취소</Badge>
  }
}

export function ProjectListPage() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [clientFilter, setClientFilter] = useState('')
  const [appliedStatus, setAppliedStatus] = useState<StatusFilter>('all')
  const [appliedClient, setAppliedClient] = useState('')

  const { data: projects, isLoading, error } = useProjects({
    status: appliedStatus === 'all' ? undefined : appliedStatus,
    client: appliedClient || undefined,
  })

  const handleSearch = () => {
    setAppliedStatus(statusFilter)
    setAppliedClient(clientFilter)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">프로젝트 목록</h1>
        {isAdmin && (
          <Button onClick={() => navigate('/projects/new')}>
            <Plus className="h-4 w-4 mr-2" />
            새 프로젝트
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3 flex-wrap">
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="진행중">진행중</SelectItem>
                <SelectItem value="완료">완료</SelectItem>
                <SelectItem value="대기">대기</SelectItem>
                <SelectItem value="취소">취소</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="발주사 검색"
              value={clientFilter}
              onChange={e => setClientFilter(e.target.value)}
              className="w-48"
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <Button variant="outline" onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              검색
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            총 {projects?.length ?? 0}건
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-16 text-muted-foreground">
              불러오는 중...
            </div>
          ) : error ? (
            <div className="flex justify-center items-center py-16 text-destructive">
              데이터를 불러오지 못했습니다.
            </div>
          ) : !projects?.length ? (
            <div className="flex justify-center items-center py-16 text-muted-foreground">
              프로젝트가 없습니다.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>프로젝트코드</TableHead>
                  <TableHead>프로젝트명</TableHead>
                  <TableHead>발주사</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>시작일</TableHead>
                  <TableHead>종료일</TableHead>
                  <TableHead className="text-right">총계약공수</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map(project => (
                  <TableRow
                    key={project.project_code}
                    className="cursor-pointer"
                    onClick={() => navigate(`/projects/${project.project_code}`)}
                  >
                    <TableCell className="font-mono">{project.project_code}</TableCell>
                    <TableCell className="font-medium">{project.project_name}</TableCell>
                    <TableCell>{project.client}</TableCell>
                    <TableCell>{statusBadge(project.status)}</TableCell>
                    <TableCell>{project.start_date}</TableCell>
                    <TableCell>{project.end_date}</TableCell>
                    <TableCell className="text-right">{Number(project.total_manpower).toFixed(2)}</TableCell>
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
