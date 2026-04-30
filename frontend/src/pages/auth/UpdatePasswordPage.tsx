import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { authApi } from '../../api/auth'
import { useToast } from '../../components/ui/toast'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'

export function UpdatePasswordPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const update = (field: keyof typeof form, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.new_password !== form.confirm_password) {
      setError('새 비밀번호가 일치하지 않습니다.')
      return
    }
    if (form.new_password.length < 4) {
      setError('비밀번호는 4자 이상이어야 합니다.')
      return
    }

    setPending(true)
    try {
      await authApi.changePassword(id!, {
        current_password: form.current_password,
        new_password: form.new_password,
      })
      toast({ title: '비밀번호가 변경되었습니다.', variant: 'success' })
      navigate(-1)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      setError(axiosErr.response?.data?.detail ?? '변경에 실패했습니다.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-6 max-w-md">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          뒤로
        </Button>
        <h1 className="text-2xl font-bold">비밀번호 변경</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>새 비밀번호 설정 — {id}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current_password">현재 비밀번호 *</Label>
              <Input
                id="current_password"
                type="password"
                value={form.current_password}
                onChange={e => update('current_password', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_password">새 비밀번호 *</Label>
              <Input
                id="new_password"
                type="password"
                value={form.new_password}
                onChange={e => update('new_password', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">새 비밀번호 확인 *</Label>
              <Input
                id="confirm_password"
                type="password"
                value={form.confirm_password}
                onChange={e => update('confirm_password', e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={pending}>
                {pending ? '변경 중...' : '변경하기'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>취소</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
