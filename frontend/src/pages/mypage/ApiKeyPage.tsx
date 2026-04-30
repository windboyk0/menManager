import { useState } from 'react'
import { Eye, EyeOff, Key, Trash2, RefreshCw } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mcpApi } from '../../api/skills'
import { useToast } from '../../components/ui/toast'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog'

export function ApiKeyPage() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [showKey, setShowKey] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: apiKey, isLoading } = useQuery({
    queryKey: ['mcp-apikey'],
    queryFn: () => mcpApi.getApiKey().then(r => r.data),
    retry: (count, error: unknown) => {
      const axiosErr = error as { response?: { status?: number } }
      if (axiosErr.response?.status === 404) return false
      return count < 1
    },
  })

  const { data: history } = useQuery({
    queryKey: ['mcp-history'],
    queryFn: () => mcpApi.getHistory().then(r => r.data),
  })

  const createKey = useMutation({
    mutationFn: () => mcpApi.createApiKey().then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mcp-apikey'] })
      qc.invalidateQueries({ queryKey: ['mcp-history'] })
      toast({ title: 'API Key가 발급되었습니다.', variant: 'success' })
    },
    onError: () => toast({ title: '발급 실패', variant: 'destructive' }),
  })

  const deleteKey = useMutation({
    mutationFn: () => mcpApi.deleteApiKey(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mcp-apikey'] })
      setDeleteOpen(false)
      toast({ title: 'API Key가 삭제되었습니다.', variant: 'success' })
    },
    onError: () => toast({ title: '삭제 실패', variant: 'destructive' }),
  })

  const maskKey = (key: string) => {
    if (showKey) return key
    return key.slice(0, 8) + '•'.repeat(Math.max(0, key.length - 12)) + key.slice(-4)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">MCP API Key 관리</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            현재 API Key
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">불러오는 중...</p>
          ) : apiKey?.is_active ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <code className="flex-1 rounded-md bg-muted px-3 py-2 text-sm font-mono break-all">
                  {maskKey(apiKey.api_key)}
                </code>
                <Button variant="ghost" size="sm" onClick={() => setShowKey(v => !v)}>
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex gap-2">
                  <dt className="text-muted-foreground w-24">상태</dt>
                  <dd><Badge variant="success">활성</Badge></dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted-foreground w-24">발급일시</dt>
                  <dd>{new Date(apiKey.created_at).toLocaleString('ko-KR')}</dd>
                </div>
                {apiKey.last_used_at && (
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground w-24">마지막 사용</dt>
                    <dd>{new Date(apiKey.last_used_at).toLocaleString('ko-KR')}</dd>
                  </div>
                )}
              </dl>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => createKey.mutate()} disabled={createKey.isPending}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  재발급
                </Button>
                <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  삭제
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">발급된 API Key가 없습니다.</p>
              <Button onClick={() => createKey.mutate()} disabled={createKey.isPending}>
                <Key className="h-4 w-4 mr-2" />
                {createKey.isPending ? '발급 중...' : 'API Key 발급'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>사용 이력</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!history?.length ? (
            <p className="text-muted-foreground text-sm p-6">사용 이력이 없습니다.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>사용일시</TableHead>
                  <TableHead>Tool명</TableHead>
                  <TableHead>요청내용</TableHead>
                  <TableHead>응답상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map(h => (
                  <TableRow key={h.id}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {new Date(h.used_at).toLocaleString('ko-KR')}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{h.tool_name}</code>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm">{h.request_content}</TableCell>
                    <TableCell>
                      <Badge
                        variant={h.response_status === 'success' ? 'success' : 'destructive'}
                      >
                        {h.response_status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key 삭제</DialogTitle>
            <DialogDescription>
              현재 API Key를 삭제하시겠습니까? 삭제 후 MCP 연동이 중단됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>취소</Button>
            <Button variant="destructive" onClick={() => deleteKey.mutate()} disabled={deleteKey.isPending}>삭제</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
