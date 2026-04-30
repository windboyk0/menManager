import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Edit2, Trash2, History, Save, X } from 'lucide-react'
import { useProject, useUpdateProject, useDeleteProject } from '../../hooks/useProjects'
import { useAssignments } from '../../hooks/useAssignments'
import { useEmployees } from '../../hooks/useEmployees'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../components/ui/toast'
import type { ProjectUpdate, Project } from '../../types/project'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog'

function statusColor(status: Project['status']) {
  switch (status) {
    case '진행중': return <Badge className="bg-blue-100 text-blue-800">진행중</Badge>
    case '완료': return <Badge variant="success">완료</Badge>
    case '대기': return <Badge variant="warning">대기</Badge>
    case '취소': return <Badge variant="destructive">취소</Badge>
  }
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const { toast } = useToast()
  const [editing, setEditing] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [form, setForm] = useState<ProjectUpdate>({})

  const { data: project, isLoading } = useProject(id ?? '')
  const { data: assignments } = useAssignments({ project_code: id ?? '' })
  const { data: employees } = useEmployees()
  const empMap = Object.fromEntries((employees ?? []).map(e => [e.employee_id, e.name]))
  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject()

  const startEdit = () => {
    if (!project) return
    setForm({
      client: project.client,
      project_name: project.project_name,
      start_date: project.start_date,
      end_date: project.end_date,
      status: project.status,
      inspection_date: project.inspection_date ?? '',
      total_manpower: project.total_manpower,
      contract_amount: project.contract_amount,
      senior_manpower: project.senior_manpower,
      advanced_manpower: project.advanced_manpower,
      intermediate_manpower: project.intermediate_manpower,
      junior_manpower: project.junior_manpower,
    })
    setEditing(true)
  }

  const handleSave = async () => {
    if (!id) return
    try {
      await updateProject.mutateAsync({ code: id, data: form })
      toast({ title: '저장 완료', variant: 'success' })
      setEditing(false)
    } catch {
      toast({ title: '저장 실패', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!id) return
    try {
      await deleteProject.mutateAsync(id)
      toast({ title: '삭제 완료', variant: 'success' })
      navigate('/projects')
    } catch {
      toast({ title: '삭제 실패', variant: 'destructive' })
    }
  }

  const updateField = (field: keyof ProjectUpdate, value: string | number) =>
    setForm(prev => ({ ...prev, [field]: value }))

  if (isLoading) {
    return <div className="flex justify-center py-16 text-muted-foreground">불러오는 중...</div>
  }

  if (!project) {
    return <div className="flex justify-center py-16 text-destructive">프로젝트를 찾을 수 없습니다.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            목록
          </Button>
          <h1 className="text-2xl font-bold">{project.project_name}</h1>
          {statusColor(project.status)}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/projects/${id}/history`}>
              <History className="h-4 w-4 mr-1" />
              이력 조회
            </Link>
          </Button>
          {isAdmin && !editing && (
            <>
              <Button variant="outline" size="sm" onClick={startEdit}>
                <Edit2 className="h-4 w-4 mr-1" />
                수정
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4 mr-1" />
                삭제
              </Button>
            </>
          )}
          {editing && (
            <>
              <Button size="sm" onClick={handleSave} disabled={updateProject.isPending}>
                <Save className="h-4 w-4 mr-1" />
                저장
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                <X className="h-4 w-4 mr-1" />
                취소
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>프로젝트 정보</CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>프로젝트명</Label>
                <Input value={form.project_name ?? ''} onChange={e => updateField('project_name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>발주사</Label>
                <Input value={form.client ?? ''} onChange={e => updateField('client', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>상태</Label>
                <Select value={form.status ?? ''} onValueChange={v => updateField('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['진행중', '완료', '대기', '취소'] as const).map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>검수일</Label>
                <Input type="date" value={form.inspection_date ?? ''} onChange={e => updateField('inspection_date', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>시작일</Label>
                <Input type="date" value={form.start_date ?? ''} onChange={e => updateField('start_date', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>종료일</Label>
                <Input type="date" value={form.end_date ?? ''} onChange={e => updateField('end_date', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>총계약공수</Label>
                <Input type="number" min="0" step="0.01" value={form.total_manpower ?? 0} onChange={e => updateField('total_manpower', Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>계약금액</Label>
                <Input type="number" value={form.contract_amount ?? 0} onChange={e => updateField('contract_amount', Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>특급공수</Label>
                <Input type="number" min="0" step="0.01" value={form.senior_manpower ?? 0} onChange={e => updateField('senior_manpower', Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>고급공수</Label>
                <Input type="number" min="0" step="0.01" value={form.advanced_manpower ?? 0} onChange={e => updateField('advanced_manpower', Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>중급공수</Label>
                <Input type="number" min="0" step="0.01" value={form.intermediate_manpower ?? 0} onChange={e => updateField('intermediate_manpower', Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>초급공수</Label>
                <Input type="number" min="0" step="0.01" value={form.junior_manpower ?? 0} onChange={e => updateField('junior_manpower', Number(e.target.value))} />
              </div>
            </div>
          ) : (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                ['프로젝트코드', project.project_code],
                ['프로젝트명', project.project_name],
                ['발주사', project.client],
                ['상태', project.status],
                ['시작일', project.start_date],
                ['종료일', project.end_date],
                ['검수일', project.inspection_date ?? '-'],
                ['총계약공수', Number(project.total_manpower).toFixed(2)],
                ['계약금액', project.contract_amount.toLocaleString()],
                ['특급공수', Number(project.senior_manpower).toFixed(2)],
                ['고급공수', Number(project.advanced_manpower).toFixed(2)],
                ['중급공수', Number(project.intermediate_manpower).toFixed(2)],
                ['초급공수', Number(project.junior_manpower).toFixed(2)],
              ].map(([label, val]) => (
                <div key={String(label)} className="flex gap-2">
                  <dt className="font-medium text-muted-foreground w-24 shrink-0">{label}</dt>
                  <dd>{val}</dd>
                </div>
              ))}
            </dl>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>배치 인원</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!assignments?.length ? (
            <p className="text-muted-foreground text-sm p-6">배치된 인원이 없습니다.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>직원명(사번)</TableHead>
                  <TableHead>투입월</TableHead>
                  <TableHead className="text-right">투입공수(MM)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map(a => (
                  <TableRow
                    key={`${a.employee_id}-${a.project_code}-${a.input_month}`}
                    className="cursor-pointer"
                    onClick={() => navigate(`/assignments/${a.employee_id}/${a.project_code}`)}
                  >
                    <TableCell>{empMap[a.employee_id] ?? a.employee_id}({a.employee_id})</TableCell>
                    <TableCell className="font-mono">{a.input_month}</TableCell>
                    <TableCell className="text-right">{Number(a.input_manpower)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>프로젝트 삭제</DialogTitle>
            <DialogDescription>
              "{project.project_name}"을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>취소</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteProject.isPending}>삭제</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
