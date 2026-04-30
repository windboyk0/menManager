import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Trash2, History, Save, X } from 'lucide-react'
import { useAssignmentMonths, useUpdateAssignmentMonth, useDeleteAssignment } from '../../hooks/useAssignments'
import { useEmployee } from '../../hooks/useEmployees'
import { useProject } from '../../hooks/useProjects'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../components/ui/toast'
import type { AssignmentUpdate } from '../../types/assignment'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog'

export function AssignmentDetailPage() {
  const { empId, projCode } = useParams<{ empId: string; projCode: string }>()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const { toast } = useToast()
  const [editingMonth, setEditingMonth] = useState<string | null>(null)
  const [editManpower, setEditManpower] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: months, isLoading } = useAssignmentMonths(empId ?? '', projCode ?? '')
  const { data: employee } = useEmployee(empId ?? '')
  const { data: project } = useProject(projCode ?? '')
  const updateMonth = useUpdateAssignmentMonth()
  const deleteAssignment = useDeleteAssignment()

  const startEdit = (month: string, manpower: number) => {
    setEditingMonth(month)
    setEditManpower(String(manpower))
  }

  const handleSave = async (month: string) => {
    if (!empId || !projCode) return
    const data: AssignmentUpdate = {
      input_manpower: parseFloat(Number(editManpower).toFixed(2)),
    }
    try {
      await updateMonth.mutateAsync({ empId, projCode, month, data })
      toast({ title: '저장 완료', variant: 'success' })
      setEditingMonth(null)
    } catch {
      toast({ title: '저장 실패', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!empId || !projCode) return
    try {
      await deleteAssignment.mutateAsync({ empId, projCode })
      toast({ title: '삭제 완료', variant: 'success' })
      navigate('/assignments')
    } catch {
      toast({ title: '삭제 실패', variant: 'destructive' })
    }
  }

  if (isLoading) return <div className="py-16 text-center text-muted-foreground">불러오는 중...</div>
  if (!months?.length) return <div className="py-16 text-center text-destructive">배치 정보를 찾을 수 없습니다.</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/assignments')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            목록
          </Button>
          <h1 className="text-2xl font-bold">인력 배치 상세</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/assignments/${empId}/${projCode}/history`}>
              <History className="h-4 w-4 mr-1" />
              이력 조회
            </Link>
          </Button>
          {isAdmin && (
            <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4 mr-1" />
              전체 삭제
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {employee?.name ?? empId}({empId}) — {project?.project_name ?? projCode}({projCode})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>투입월</TableHead>
                <TableHead className="text-right">투입공수(MM)</TableHead>
                {isAdmin && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {months.map(a => (
                <TableRow key={a.input_month}>
                  <TableCell className="font-mono">{a.input_month}</TableCell>
                  <TableCell className="text-right">
                    {editingMonth === a.input_month ? (
                      <Input
                        type="number"
                        min="0.01"
                        max="1.0"
                        step="0.01"
                        className="w-24 h-7 text-right inline-block"
                        value={editManpower}
                        onChange={e => setEditManpower(e.target.value)}
                      />
                    ) : (
                      <span className={Number(a.input_manpower) >= 1.0 ? 'font-semibold text-destructive' : ''}>
                        {Number(a.input_manpower)}
                      </span>
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      {editingMonth === a.input_month ? (
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => handleSave(a.input_month)} disabled={updateMonth.isPending}>
                            <Save className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingMonth(null)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => startEdit(a.input_month, Number(a.input_manpower))}>
                          수정
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>배치 전체 삭제</DialogTitle>
            <DialogDescription>
              {empId} / {projCode} 전체 {months.length}개월 배치를 삭제하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>취소</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteAssignment.isPending}>삭제</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
