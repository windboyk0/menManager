import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useCreateEmployee } from '../../hooks/useEmployees'
import { useToast } from '../../components/ui/toast'
import type { EmployeeCreate } from '../../types/employee'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'

type FormState = {
  employee_id: string
  name: string
  career_years: string
  grade: '특급' | '고급' | '중급' | '초급'
  join_date: string
  position: string
  title: string
}

const initial: FormState = {
  employee_id: '',
  name: '',
  career_years: '0',
  grade: '중급',
  join_date: '',
  position: '',
  title: '',
}

export function EmployeeNewPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [form, setForm] = useState<FormState>(initial)
  const [error, setError] = useState('')
  const createEmployee = useCreateEmployee()

  const update = (field: keyof FormState, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    const payload: EmployeeCreate = {
      employee_id: form.employee_id,
      name: form.name,
      career_years: Number(form.career_years),
      grade: form.grade,
      join_date: form.join_date,
      position: form.position,
      title: form.title,
    }
    try {
      const emp = await createEmployee.mutateAsync(payload)
      toast({ title: '직원이 등록되었습니다.', variant: 'success' })
      navigate(`/employees/${emp.employee_id}`)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      setError(axiosErr.response?.data?.detail ?? '등록에 실패했습니다.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/employees')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          목록
        </Button>
        <h1 className="text-2xl font-bold">새 직원 등록</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>직원 정보 입력</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee_id">사번 *</Label>
                <Input id="employee_id" value={form.employee_id} onChange={e => update('employee_id', e.target.value)} required placeholder="EMP001" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">이름 *</Label>
                <Input id="name" value={form.name} onChange={e => update('name', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="career_years">경력(년) *</Label>
                <Input id="career_years" type="number" min="0" value={form.career_years} onChange={e => update('career_years', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>등급 *</Label>
                <Select value={form.grade} onValueChange={v => update('grade', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['특급', '고급', '중급', '초급'] as const).map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="join_date">입사일 *</Label>
                <Input id="join_date" type="date" value={form.join_date} onChange={e => update('join_date', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">직급 *</Label>
                <Input id="position" value={form.position} onChange={e => update('position', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">직책 *</Label>
                <Input id="title" value={form.title} onChange={e => update('title', e.target.value)} required />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={createEmployee.isPending}>
                {createEmployee.isPending ? '등록 중...' : '직원 등록'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/employees')}>취소</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
