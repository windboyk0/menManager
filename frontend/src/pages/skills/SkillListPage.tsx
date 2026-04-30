import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useSkills, useCreateSkill, useUpdateSkill, useDeleteSkill } from '../../hooks/useSkills'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../components/ui/toast'
import type { SkillCreate } from '../../types/skill'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog'

export function SkillListPage() {
  const { isAdmin } = useAuth()
  const { toast } = useToast()
  const { data: skills, isLoading } = useSkills()
  const createSkill = useCreateSkill()
  const updateSkill = useUpdateSkill()
  const deleteSkill = useDeleteSkill()

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [newSkill, setNewSkill] = useState<SkillCreate>({ skill_name: '', category: '' })
  const [editTarget, setEditTarget] = useState<{ id: number; skill_name: string; category: string } | null>(null)

  const handleCreate = async () => {
    try {
      await createSkill.mutateAsync(newSkill)
      toast({ title: '스킬이 추가되었습니다.', variant: 'success' })
      setCreateOpen(false)
      setNewSkill({ skill_name: '', category: '' })
    } catch {
      toast({ title: '추가 실패', variant: 'destructive' })
    }
  }

  const openEdit = (id: number, skill_name: string, category: string) => {
    setEditTarget({ id, skill_name, category })
    setEditOpen(true)
  }

  const handleEdit = async () => {
    if (!editTarget) return
    try {
      await updateSkill.mutateAsync({
        id: editTarget.id,
        data: { skill_name: editTarget.skill_name, category: editTarget.category },
      })
      toast({ title: '수정되었습니다.', variant: 'success' })
      setEditOpen(false)
    } catch {
      toast({ title: '수정 실패', variant: 'destructive' })
    }
  }

  const [deleteId, setDeleteId] = useState<number | null>(null)

  const openDelete = (id: number) => {
    setDeleteId(id)
    setDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (deleteId === null) return
    try {
      await deleteSkill.mutateAsync(deleteId)
      toast({ title: '삭제되었습니다.', variant: 'success' })
      setDeleteOpen(false)
    } catch {
      toast({ title: '삭제 실패', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">스킬 목록</h1>
        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            새 스킬
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">총 {skills?.length ?? 0}개</CardTitle>
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
                  <TableHead>스킬ID</TableHead>
                  <TableHead>스킬명</TableHead>
                  <TableHead>카테고리</TableHead>
                  {isAdmin && <TableHead className="text-right">관리</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {skills.map(s => (
                  <TableRow key={s.skill_id}>
                    <TableCell className="font-mono text-muted-foreground">{s.skill_id}</TableCell>
                    <TableCell className="font-medium">{s.skill_name}</TableCell>
                    <TableCell>{s.category}</TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(s.skill_id, s.skill_name, s.category)}>
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

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 스킬 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>스킬명</Label>
              <Input
                value={newSkill.skill_name}
                onChange={e => setNewSkill(prev => ({ ...prev, skill_name: e.target.value }))}
                placeholder="React"
              />
            </div>
            <div className="space-y-2">
              <Label>카테고리</Label>
              <Input
                value={newSkill.category}
                onChange={e => setNewSkill(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Frontend"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>취소</Button>
            <Button
              onClick={handleCreate}
              disabled={!newSkill.skill_name || !newSkill.category || createSkill.isPending}
            >
              추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>스킬 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>스킬명</Label>
              <Input
                value={editTarget?.skill_name ?? ''}
                onChange={e => setEditTarget(prev => prev ? { ...prev, skill_name: e.target.value } : null)}
              />
            </div>
            <div className="space-y-2">
              <Label>카테고리</Label>
              <Input
                value={editTarget?.category ?? ''}
                onChange={e => setEditTarget(prev => prev ? { ...prev, category: e.target.value } : null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>취소</Button>
            <Button onClick={handleEdit} disabled={updateSkill.isPending}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>스킬 삭제</DialogTitle>
            <DialogDescription>이 스킬을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>취소</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteSkill.isPending}>삭제</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
