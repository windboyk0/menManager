import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../../api/auth'
import type { RegisterRequest } from '../../types/auth'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'

type FormState = Omit<RegisterRequest, 'career_years'> & { career_years: string }

const initialState: FormState = {
  employee_id: '',
  name: '',
  career_years: '',
  grade: '중급',
  join_date: '',
  position: '',
  title: '',
  username: '',
  password: '',
  role: '일반',
}

export function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(initialState)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (field: keyof FormState, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload: RegisterRequest = {
        ...form,
        career_years: Number(form.career_years),
      }
      await authApi.register(payload)
      navigate('/login')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      setError(axiosErr.response?.data?.detail ?? '회원가입에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">회원가입</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee_id">사번</Label>
                <Input
                  id="employee_id"
                  value={form.employee_id}
                  onChange={e => update('employee_id', e.target.value)}
                  required
                  placeholder="EMP001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={e => update('name', e.target.value)}
                  required
                  placeholder="홍길동"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="career_years">경력(년)</Label>
                <Input
                  id="career_years"
                  type="number"
                  min="0"
                  value={form.career_years}
                  onChange={e => update('career_years', e.target.value)}
                  required
                  placeholder="5"
                />
              </div>
              <div className="space-y-2">
                <Label>등급</Label>
                <Select value={form.grade} onValueChange={v => update('grade', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['특급', '고급', '중급', '초급'] as const).map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="join_date">입사일</Label>
              <Input
                id="join_date"
                type="date"
                value={form.join_date}
                onChange={e => update('join_date', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">직급</Label>
                <Input
                  id="position"
                  value={form.position}
                  onChange={e => update('position', e.target.value)}
                  required
                  placeholder="대리"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">직책</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={e => update('title', e.target.value)}
                  required
                  placeholder="팀원"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">아이디</Label>
                <Input
                  id="username"
                  value={form.username}
                  onChange={e => update('username', e.target.value)}
                  required
                  placeholder="user123"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>권한</Label>
              <Select value={form.role} onValueChange={v => update('role', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="일반">일반</SelectItem>
                  <SelectItem value="관리자">관리자</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '처리 중...' : '회원가입'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              로그인
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
