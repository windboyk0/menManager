import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useCreateAssignment } from '../../hooks/useAssignments'
import { useEmployees } from '../../hooks/useEmployees'
import { useProjects } from '../../hooks/useProjects'
import { useToast } from '../../components/ui/toast'
import type { AssignmentCreate } from '../../types/assignment'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'

type FormState = {
  employee_id: string
  project_code: string
  input_month: string
  input_manpower: string
}

const initial: FormState = {
  employee_id: '',
  project_code: '',
  input_month: '',
  input_manpower: '1.0',
}

export function AssignmentNewPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [form, setForm] = useState<FormState>(initial)
  const [error, setError] = useState('')
  const createAssignment = useCreateAssignment()
  const { data: employees } = useEmployees()
  const { data: projects } = useProjects()

  const update = (field: keyof FormState, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const manpower = Number(form.input_manpower)
    if (isNaN(manpower) || manpower <= 0 || manpower > 1.0) {
      setError('투입공수는 0 초과 1.0 이하여야 합니다. (예: 0.5)')
      return
    }

    const payload: AssignmentCreate = {
      employee_id: form.employee_id,
      project_code: form.project_code,
      input_month: form.input_month,
      input_manpower: manpower,
    }

    try {
      await createAssignment.mutateAsync(payload)
      toast({ title: '배치가 등록되었습니다.', variant: 'success' })
      navigate('/assignments')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { detail?: string } } }
      if (axiosErr.response?.status === 409) {
        setError(axiosErr.response?.data?.detail ?? '배치 충돌: 해당 월에 이미 배치가 존재합니다.')
      } else {
        setError(axiosErr.response?.data?.detail ?? '등록에 실패했습니다.')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/assignments')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          목록
        </Button>
        <h1 className="text-2xl font-bold">새 인력 배치</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>배치 정보 입력</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>직원 *</Label>
                <Select value={form.employee_id} onValueChange={v => update('employee_id', v)}>
                  <SelectTrigger><SelectValue placeholder="직원 선택" /></SelectTrigger>
                  <SelectContent>
                    {employees?.map(emp => (
                      <SelectItem key={emp.employee_id} value={emp.employee_id}>
                        {emp.name} ({emp.employee_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>프로젝트 *</Label>
                <Select value={form.project_code} onValueChange={v => update('project_code', v)}>
                  <SelectTrigger><SelectValue placeholder="프로젝트 선택" /></SelectTrigger>
                  <SelectContent>
                    {projects?.map(p => (
                      <SelectItem key={p.project_code} value={p.project_code}>
                        {p.project_name} ({p.project_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="input_month">투입월 *</Label>
                <Input
                  id="input_month"
                  type="month"
                  value={form.input_month}
                  onChange={e => update('input_month', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="input_manpower">투입공수 *</Label>
                <Input
                  id="input_manpower"
                  type="number"
                  min="0.01"
                  max="1.0"
                  step="0.01"
                  placeholder="예: 0.5"
                  value={form.input_manpower}
                  onChange={e => update('input_manpower', e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">0.01 ~ 1.0 (예: 0.5 = 50%)</p>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={createAssignment.isPending || !form.employee_id || !form.project_code}
              >
                {createAssignment.isPending ? '등록 중...' : '배치 등록'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/assignments')}>취소</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
