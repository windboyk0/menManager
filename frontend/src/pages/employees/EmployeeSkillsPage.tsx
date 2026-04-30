import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react'
import { useEmployeeSkills, useAddEmployeeSkill, useUpdateEmployeeSkill, useDeleteEmployeeSkill } from '../../hooks/useEmployees'
import { useSkills } from '../../hooks/useSkills'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../components/ui/toast'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'

export function EmployeeSkillsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const { toast } = useToast()

  const { data: skills, isLoading } = useEmployeeSkills(id ?? '')
  const { data: allSkills } = useSkills()
  const addSkill = useAddEmployeeSkill()
  const updateSkill = useUpdateEmployeeSkill()
  const deleteSkill = useDeleteEmployeeSkill()

  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedSkillId, setSelectedSkillId] = useState<string>('')
  const [proficiency, setProficiency] = useState<string>('3')
  const [editingSkillId, setEditingSkillId] = useState<number | null>(null)

  const handleAdd = async () => {
    if (!id || !selectedSkillId) return
    try {
      await addSkill.mutateAsync({ id, data: { skill_id: Number(selectedSkillId), proficiency: Number(proficiency) } })
      toast({ title: '스킬이 추가되었습니다.', variant: 'success' })
      setAddOpen(false)
      setSelectedSkillId('')
      setProficiency('3')
    } catch {
      toast({ title: '추가 실패', variant: 'destructive' })
    }
  }

  const openEdit = (skillId: number, currentProficiency: number) => {
    setEditingSkillId(skillId)
    setProficiency(String(currentProficiency))
    setEditOpen(true)
  }

  const handleEdit = async () => {
    if (!id || editingSkillId === null) return
    try {
      await updateSkill.mutateAsync({ id, skillId: editingSkillId, data: { proficiency: Number(proficiency) } })
      toast({ title: '수정되었습니다.', variant: 'success' })
      setEditOpen(false)
    } catch {
      toast({ title: '수정 실패', variant: 'destructive' })
    }
  }

  const openDelete = (skillId: number) => {
    setEditingSkillId(skillId)
    setDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!id || editingSkillId === null) return
    try {
      await deleteSkill.mutateAsync({ id, skillId: editingSkillId })
      toast({ title: '삭제되었습니다.', variant: 'success' })
      setDeleteOpen(false)
    } catch {
      toast({ title: '삭제 실패', variant: 'destructive' })
    }
  }

  const availableSkills = allSkills?.filter(s => !skills?.some(es => es.skill_id === s.skill_id)) ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/employees/${id}`)}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            직원 상세
          </Button>
          <h1 className="text-2xl font-bold">스킬 관리</h1>
          <span className="text-muted-foreground text-sm">({id})</span>
        </div>
        {isAdmin && (
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            스킬 추가
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>보유 스킬</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 text-center text-muted-foreground">불러오는 중...</div>
          ) : !skills?.length ? (
            <div className="py-16 text-center text-muted-foreground">등록된 스킬이 없습니다.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>스킬명</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead>숙련도 (1-5)</TableHead>
                  {isAdmin && <TableHead className="text-right">관리</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {skills.map(s => (
                  <TableRow key={s.skill_id}>
                    <TableCell className="font-medium">{s.skill_name}</TableCell>
                    <TableCell>{s.category}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        {'★'.repeat(s.proficiency)}{'☆'.repeat(5 - s.proficiency)}
                        <span className="text-xs text-muted-foreground ml-1">({s.proficiency})</span>
                      </span>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(s.skill_id, s.proficiency)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openDelete(s.skill_id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Skill Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>스킬 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>스킬 선택</Label>
              <Select value={selectedSkillId} onValueChange={setSelectedSkillId}>
                <SelectTrigger>
                  <SelectValue placeholder="스킬을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {availableSkills.map(s => (
                    <SelectItem key={s.skill_id} value={String(s.skill_id)}>
                      {s.skill_name} ({s.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>숙련도 (1-5)</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={proficiency}
                onChange={e => setProficiency(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>취소</Button>
            <Button onClick={handleAdd} disabled={!selectedSkillId || addSkill.isPending}>추가</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Proficiency Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>숙련도 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>숙련도 (1-5)</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={proficiency}
                onChange={e => setProficiency(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>취소</Button>
            <Button onClick={handleEdit} disabled={updateSkill.isPending}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>스킬 삭제</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">이 스킬을 삭제하시겠습니까?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>취소</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteSkill.isPending}>삭제</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
