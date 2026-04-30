import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useCreateProject } from '../../hooks/useProjects'
import { useToast } from '../../components/ui/toast'
import type { ProjectCreate } from '../../types/project'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'

type FormState = {
  project_code: string
  client: string
  project_name: string
  start_date: string
  end_date: string
  status: '진행중' | '완료' | '대기' | '취소'
  inspection_date: string
  total_manpower: string
  contract_amount: string
  senior_manpower: string
  advanced_manpower: string
  intermediate_manpower: string
  junior_manpower: string
}

const initial: FormState = {
  project_code: '',
  client: '',
  project_name: '',
  start_date: '',
  end_date: '',
  status: '진행중',
  inspection_date: '',
  total_manpower: '0',
  contract_amount: '0',
  senior_manpower: '0',
  advanced_manpower: '0',
  intermediate_manpower: '0',
  junior_manpower: '0',
}

export function ProjectNewPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [form, setForm] = useState<FormState>(initial)
  const [error, setError] = useState('')
  const createProject = useCreateProject()

  const update = (field: keyof FormState, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.end_date && form.start_date && form.end_date < form.start_date) {
      setError('종료일은 시작일보다 이후여야 합니다.')
      return
    }

    const payload: ProjectCreate = {
      project_code: form.project_code,
      client: form.client,
      project_name: form.project_name,
      start_date: form.start_date,
      end_date: form.end_date,
      status: form.status,
      inspection_date: form.inspection_date || undefined,
      total_manpower: Number(form.total_manpower),
      contract_amount: Number(form.contract_amount),
      senior_manpower: Number(form.senior_manpower),
      advanced_manpower: Number(form.advanced_manpower),
      intermediate_manpower: Number(form.intermediate_manpower),
      junior_manpower: Number(form.junior_manpower),
    }

    try {
      const project = await createProject.mutateAsync(payload)
      toast({ title: '프로젝트가 생성되었습니다.', variant: 'success' })
      navigate(`/projects/${project.project_code}`)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      setError(axiosErr.response?.data?.detail ?? '생성에 실패했습니다.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          목록
        </Button>
        <h1 className="text-2xl font-bold">새 프로젝트</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>프로젝트 정보 입력</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project_code">프로젝트코드 *</Label>
                <Input
                  id="project_code"
                  value={form.project_code}
                  onChange={e => update('project_code', e.target.value)}
                  required
                  placeholder="PRJ001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project_name">프로젝트명 *</Label>
                <Input
                  id="project_name"
                  value={form.project_name}
                  onChange={e => update('project_name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client">발주사 *</Label>
                <Input
                  id="client"
                  value={form.client}
                  onChange={e => update('client', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>상태 *</Label>
                <Select value={form.status} onValueChange={v => update('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['진행중', '완료', '대기', '취소'] as const).map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_date">시작일 *</Label>
                <Input id="start_date" type="date" value={form.start_date} onChange={e => update('start_date', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">종료일 *</Label>
                <Input id="end_date" type="date" value={form.end_date} onChange={e => update('end_date', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inspection_date">검수일</Label>
                <Input id="inspection_date" type="date" value={form.inspection_date} onChange={e => update('inspection_date', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_manpower">총계약공수 *</Label>
                <Input id="total_manpower" type="number" min="0" step="0.01" value={form.total_manpower} onChange={e => update('total_manpower', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contract_amount">계약금액 *</Label>
                <Input id="contract_amount" type="number" min="0" value={form.contract_amount} onChange={e => update('contract_amount', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senior_manpower">특급공수</Label>
                <Input id="senior_manpower" type="number" min="0" step="0.01" value={form.senior_manpower} onChange={e => update('senior_manpower', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="advanced_manpower">고급공수</Label>
                <Input id="advanced_manpower" type="number" min="0" step="0.01" value={form.advanced_manpower} onChange={e => update('advanced_manpower', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="intermediate_manpower">중급공수</Label>
                <Input id="intermediate_manpower" type="number" min="0" step="0.01" value={form.intermediate_manpower} onChange={e => update('intermediate_manpower', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="junior_manpower">초급공수</Label>
                <Input id="junior_manpower" type="number" min="0" step="0.01" value={form.junior_manpower} onChange={e => update('junior_manpower', e.target.value)} />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={createProject.isPending}>
                {createProject.isPending ? '생성 중...' : '프로젝트 생성'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/projects')}>취소</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
