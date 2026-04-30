import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { useEmployees } from '../../hooks/useEmployees'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import type { Employee } from '../../types/employee'

function gradeBadge(grade: Employee['grade']) {
  const colors: Record<Employee['grade'], string> = {
    '특급': 'bg-purple-100 text-purple-800',
    '고급': 'bg-blue-100 text-blue-800',
    '중급': 'bg-green-100 text-green-800',
    '초급': 'bg-gray-100 text-gray-800',
  }
  return <Badge className={colors[grade]}>{grade}</Badge>
}

export function EmployeeListPage() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [gradeFilter, setGradeFilter] = useState('all')
  const [availableFrom, setAvailableFrom] = useState('')
  const [availableTo, setAvailableTo] = useState('')
  const [applied, setApplied] = useState({ grade: 'all', from: '', to: '' })

  const { data: employees, isLoading, error } = useEmployees({
    grade: applied.grade === 'all' ? undefined : applied.grade,
    available_from: applied.from || undefined,
    available_to: applied.to || undefined,
  })

  const handleSearch = () => {
    setApplied({ grade: gradeFilter, from: availableFrom, to: availableTo })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">직원 목록</h1>
        {isAdmin && (
          <Button onClick={() => navigate('/employees/new')}>
            <Plus className="h-4 w-4 mr-2" />
            새 직원
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3 flex-wrap items-end">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">등급</label>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {(['특급', '고급', '중급', '초급'] as const).map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">가용 시작일</label>
              <Input type="date" value={availableFrom} onChange={e => setAvailableFrom(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">가용 종료일</label>
              <Input type="date" value={availableTo} onChange={e => setAvailableTo(e.target.value)} className="w-40" />
            </div>
            <Button variant="outline" onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              검색
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">총 {employees?.length ?? 0}명</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 text-center text-muted-foreground">불러오는 중...</div>
          ) : error ? (
            <div className="py-16 text-center text-destructive">데이터를 불러오지 못했습니다.</div>
          ) : !employees?.length ? (
            <div className="py-16 text-center text-muted-foreground">직원이 없습니다.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>사번</TableHead>
                  <TableHead>직원명</TableHead>
                  <TableHead>등급</TableHead>
                  <TableHead>직급</TableHead>
                  <TableHead>직책</TableHead>
                  <TableHead className="text-right">경력(년)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map(emp => (
                  <TableRow
                    key={emp.employee_id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/employees/${emp.employee_id}`)}
                  >
                    <TableCell className="font-mono">{emp.employee_id}</TableCell>
                    <TableCell className="font-medium">{emp.name}</TableCell>
                    <TableCell>{gradeBadge(emp.grade)}</TableCell>
                    <TableCell>{emp.position}</TableCell>
                    <TableCell>{emp.title}</TableCell>
                    <TableCell className="text-right">{emp.career_years}년</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
