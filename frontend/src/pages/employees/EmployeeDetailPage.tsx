import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Edit2, Trash2, History, Star, Save, X } from 'lucide-react'
import { useEmployee, useUpdateEmployee, useDeleteEmployee } from '../../hooks/useEmployees'
import { useAssignments } from '../../hooks/useAssignments'
import { useProjects } from '../../hooks/useProjects'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../components/ui/toast'
import type { EmployeeUpdate } from '../../types/employee'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog'

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const { toast } = useToast()
  const [editing, setEditing] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [form, setForm] = useState<EmployeeUpdate>({})

  const { data: employee, isLoading } = useEmployee(id ?? '')
  const { data: assignments } = useAssignments({ employee_id: id ?? '' })
  const { data: projects } = useProjects()
  const projMap = Object.fromEntries((projects ?? []).map(p => [p.project_code, p.project_name]))
  const updateEmployee = useUpdateEmployee()
  const deleteEmployee = useDeleteEmployee()

  const startEdit = () => {
    if (!employee) return
    setForm({
      name: employee.name,
      career_years: employee.career_years,
      grade: employee.grade,
      join_date: employee.join_date,
      position: employee.position,
      title: employee.title,
    })
    setEditing(true)
  }

  const handleSave = async () => {
    if (!id) return
    try {
      await updateEmployee.mutateAsync({ id, data: form })
      toast({ title: '저장 완료', variant: 'success' })
      setEditing(false)
    } catch {
      toast({ title: '저장 실패', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!id) return
    try {
      await deleteEmployee.mutateAsync(id)
      toast({ title: '삭제 완료', variant: 'success' })
      navigate('/employees')
    } catch {
      toast({ title: '삭제 실패', variant: 'destructive' })
    }
  }

  const updateField = (field: keyof EmployeeUpdate, value: string | number) =>
    setForm(prev => ({ ...prev, [field]: value }))

  if (isLoading) return <div className="py-16 text-center text-muted-foreground">불러오는 중...</div>
  if (!employee) return <div className="py-16 text-center text-destructive">직원을 찾을 수 없습니다.</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/employees')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            목록
          </Button>
          <h1 className="text-2xl font-bold">{employee.name}</h1>
          <span className="text-muted-foreground text-sm">({employee.employee_id})</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/employees/${id}/history`}>
              <History className="h-4 w-4 mr-1" />
              이력 조회
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/employees/${id}/skills`}>
              <Star className="h-4 w-4 mr-1" />
              스킬 조회
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
              <Button size="sm" onClick={handleSave} disabled={updateEmployee.isPending}>
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
        <CardHeader><CardTitle>직원 정보</CardTitle></CardHeader>
        <CardContent>
          {editing ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>이름</Label>
                <Input value={form.name ?? ''} onChange={e => updateField('name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>경력(년)</Label>
                <Input type="number" min="0" value={form.career_years ?? 0} onChange={e => updateField('career_years', Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>등급</Label>
                <Select value={form.grade ?? ''} onValueChange={v => updateField('grade', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['특급', '고급', '중급', '초급'] as const).map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>입사일</Label>
                <Input type="date" value={form.join_date ?? ''} onChange={e => updateField('join_date', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>직급</Label>
                <Input value={form.position ?? ''} onChange={e => updateField('position', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>직책</Label>
                <Input value={form.title ?? ''} onChange={e => updateField('title', e.target.value)} />
              </div>
            </div>
          ) : (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                ['사번', employee.employee_id],
                ['이름', employee.name],
                ['등급', employee.grade],
                ['경력', `${employee.career_years}년`],
                ['입사일', employee.join_date],
                ['직급', employee.position],
                ['직책', employee.title],
              ].map(([label, val]) => (
                <div key={String(label)} className="flex gap-2">
                  <dt className="font-medium text-muted-foreground w-16 shrink-0">{label}</dt>
                  <dd>{val}</dd>
                </div>
              ))}
            </dl>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>현재 배치 현황</CardTitle></CardHeader>
        <CardContent className="p-0">
          {!assignments?.length ? (
            <p className="text-muted-foreground text-sm p-6">배치된 프로젝트가 없습니다.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>프로젝트명(코드)</TableHead>
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
                    <TableCell>{projMap[a.project_code] ?? a.project_code}({a.project_code})</TableCell>
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
            <DialogTitle>직원 삭제</DialogTitle>
            <DialogDescription>
              "{employee.name}"을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>취소</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteEmployee.isPending}>삭제</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
