import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useAssignments } from '../../hooks/useAssignments'
import { useEmployees } from '../../hooks/useEmployees'
import { useProjects } from '../../hooks/useProjects'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'

function monthsBetween(min: string, max: string): string[] {
  const result: string[] = []
  let [y, m] = min.split('-').map(Number)
  const [ey, em] = max.split('-').map(Number)
  while (y < ey || (y === ey && m <= em)) {
    result.push(`${y.toString().padStart(4, '0')}-${m.toString().padStart(2, '0')}`)
    m++
    if (m > 12) { m = 1; y++ }
  }
  return result
}

export function AssignmentListPage() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const ALL = '__ALL__'
  const [selectedProject, setSelectedProject] = useState(ALL)

  const { data: projects } = useProjects()
  const { data: employees } = useEmployees()
  const { data: assignments, isLoading } = useAssignments(
    selectedProject !== ALL ? { project_code: selectedProject } : undefined
  )

  const empMap = Object.fromEntries((employees ?? []).map(e => [e.employee_id, e.name]))
  const projMap = Object.fromEntries((projects ?? []).map(p => [p.project_code, p.project_name]))

  const months = assignments?.length
    ? monthsBetween(
        assignments.reduce((a, b) => a.input_month < b.input_month ? a : b).input_month,
        assignments.reduce((a, b) => a.input_month > b.input_month ? a : b).input_month,
      )
    : []

  // Group by (project_code, employee_id) → month → manpower
  type RowKey = string
  const rowMap = new Map<RowKey, { project_code: string; employee_id: string; months: Record<string, number> }>()
  for (const a of assignments ?? []) {
    const key = `${a.project_code}__${a.employee_id}`
    if (!rowMap.has(key)) rowMap.set(key, { project_code: a.project_code, employee_id: a.employee_id, months: {} })
    rowMap.get(key)!.months[a.input_month] = Number(a.input_manpower)
  }
  const rows = Array.from(rowMap.values())

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">인력 배치 현황</h1>
        {isAdmin && (
          <Button onClick={() => navigate('/assignments/new')}>
            <Plus className="h-4 w-4 mr-2" />
            새 배치
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">프로젝트</label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="프로젝트 선택 (전체)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>전체</SelectItem>
                  {projects?.map(p => (
                    <SelectItem key={p.project_code} value={p.project_code}>
                      {p.project_name} ({p.project_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">총 {rows.length}명</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="py-16 text-center text-muted-foreground">불러오는 중...</div>
          ) : !rows.length ? (
            <div className="py-16 text-center text-muted-foreground">배치 데이터가 없습니다.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium whitespace-nowrap">프로젝트명</th>
                  <th className="px-4 py-3 text-left font-medium whitespace-nowrap">사번</th>
                  <th className="px-4 py-3 text-left font-medium whitespace-nowrap">직원명</th>
                  {months.map(m => (
                    <th key={m} className="px-3 py-3 text-center font-medium whitespace-nowrap min-w-[72px]">
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr
                    key={`${row.project_code}__${row.employee_id}`}
                    className="border-b hover:bg-muted/30 cursor-pointer"
                    onClick={() => navigate(`/assignments/${row.employee_id}/${row.project_code}`)}
                  >
                    <td className="px-4 py-2 whitespace-nowrap">{projMap[row.project_code] ?? row.project_code}</td>
                    <td className="px-4 py-2 font-mono whitespace-nowrap">{row.employee_id}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{empMap[row.employee_id] ?? '-'}</td>
                    {months.map(m => {
                      const mp = row.months[m]
                      return (
                        <td key={m} className="px-3 py-2 text-center">
                          {mp != null
                            ? <span className={mp >= 1.0 ? 'font-semibold text-destructive' : ''}>{mp}</span>
                            : <span className="text-muted-foreground">-</span>
                          }
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
