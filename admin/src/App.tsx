import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import './App.css'

type ApiEnvelope<T> = { code: number; message: string; data: T }
type PageResponse<T> = { page: number; size: number; total: number; records: T[] }
type RouteKey =
  | '/'
  | '/admins'
  | '/departments'
  | '/public-reservations'
  | '/official-reservations'
  | '/official-statistics'
  | '/audit-logs'

type LoginResponse = {
  userId: number
  tokenName: string
  tokenValue: string
  displayName: string
  roles: string[]
  permissions: string[]
  passwordExpired: boolean
}

type LoginStatus = { login: boolean; userId: number; displayName: string }

type ReservationListItem = {
  id: number
  reservationNo: string
  reservationType: string
  campusId: number
  campusName: string
  applyTime: string
  visitTime: string
  organization: string
  visitorName: string
  idCard: string
  phone: string
  visitDeptId?: number
  visitDeptName?: string
  receptionist?: string
  approvalStatus: string
  peopleCount: number
}

type ReservationDetail = ReservationListItem & {
  validStartTime: string
  validEndTime: string
  trafficType: string
  plateNo?: string
  visitReason?: string
  rejectReason?: string
  passStatus?: string
  companions: { id: number; name: string; idCard: string; phone: string }[]
}

type Department = {
  id: number
  deptCode: string
  deptType: string
  deptName: string
  status: string
  createdAt: string
  updatedAt: string
}

type AdminUser = {
  id: number
  adminNo: string
  realName: string
  loginName: string
  deptId?: number
  phone?: string
  accountStatus: string
  authScope?: string
  roleIds: number[]
  roleCodes: string[]
  passwordUpdatedAt: string
}

type RoleOption = { id: number; roleCode: string; roleName: string }
type Campus = { id: number; campusCode: string; campusName: string; status: string }
type StatItem = { dimension: string; dimensionValue: string; reservationCount: number; peopleCount: number }
type AuditLog = {
  id: number
  operatorId?: number
  operatorName?: string
  operatorRole?: string
  operationType: string
  targetType?: string
  targetId?: string
  result: string
  ipAddress?: string
  userAgent?: string
  operationTime: string
  detailJson?: string
  hmacValue?: string
}

type DashboardSummary = {
  todayReservations: number
  pendingApprovals: number
  monthVisitors: number
  activeDepartments: number
  recentOfficialReservations: ReservationListItem[]
  visitTrend: { date: string; reservationCount: number; peopleCount: number }[]
  peakHour: string
  gateCongestion: string
}

type AuditSummary = {
  todayActiveAdminCount: number
  todayOperationCount: number
  warningCount: number
  warningRatePerSecond: number
}

class ApiError extends Error {
  readonly code: number
  readonly status: number

  constructor(message: string, code: number, status: number) {
    super(message)
    this.code = code
    this.status = status
  }
}

const tokenKey = 'passport.admin.token'
const userKey = 'passport.admin.user'
const apiBase = import.meta.env.VITE_API_BASE_URL ?? ''
const LIST_LOADING_DELAY = 320
const LIST_LOADING_MIN_VISIBLE = 160

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(tokenKey)
  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  const response = await fetch(`${apiBase}${path}`, { ...init, headers })
  const envelope = (await response.json().catch(() => null)) as ApiEnvelope<T> | null
  if (!response.ok || !envelope || envelope.code !== 0) {
    throw new ApiError(envelope?.message || '请求失败', envelope?.code ?? response.status, response.status)
  }
  return envelope.data
}

function params(values: Record<string, string | number | undefined | null>) {
  const query = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value))
  })
  const text = query.toString()
  return text ? `?${text}` : ''
}

function json(body: unknown): RequestInit {
  return { method: 'POST', body: JSON.stringify(body) }
}

function put(body: unknown): RequestInit {
  return { method: 'PUT', body: JSON.stringify(body) }
}

function fmt(value?: string) {
  if (!value) return '-'
  return value.replace('T', ' ').slice(0, 16)
}

function statusText(value?: string) {
  const map: Record<string, string> = {
    PENDING: '待审核',
    APPROVED: '已通过',
    REJECTED: '已拒绝',
    ENABLED: '启用',
    DISABLED: '禁用',
    NORMAL: '正常',
    LOCKED: '锁定',
    SUCCESS: '成功',
    FAIL: '失败',
  }
  return value ? (map[value] ?? value) : '-'
}

function badgeTone(value?: string) {
  if (['APPROVED', 'ENABLED', 'NORMAL', 'SUCCESS'].includes(value ?? '')) return 'success'
  if (['PENDING', 'LOCKED'].includes(value ?? '')) return 'warning'
  if (['REJECTED', 'DISABLED', 'FAIL'].includes(value ?? '')) return 'danger'
  return 'muted'
}

function toStart(date?: string) {
  return date ? `${date}T00:00:00` : undefined
}

function toEnd(date?: string) {
  return date ? `${date}T23:59:59` : undefined
}

function useDeferredLoading() {
  const [pending, setPending] = useState(false)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<number | null>(null)
  const stopTimerRef = useRef<number | null>(null)
  const loadingRef = useRef(false)
  const loadingVisibleAtRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
      }
      if (stopTimerRef.current !== null) {
        window.clearTimeout(stopTimerRef.current)
      }
    }
  }, [])

  function setVisibleLoading(value: boolean) {
    loadingRef.current = value
    setLoading(value)
  }

  function showLoading() {
    loadingVisibleAtRef.current = performance.now()
    setVisibleLoading(true)
  }

  function start(immediate = false) {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (stopTimerRef.current !== null) {
      window.clearTimeout(stopTimerRef.current)
      stopTimerRef.current = null
    }
    setPending(true)
    if (immediate) {
      showLoading()
      return
    }
    if (loadingRef.current) return
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null
      showLoading()
    }, LIST_LOADING_DELAY)
  }

  function stop() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setPending(false)
    if (!loadingRef.current) {
      loadingVisibleAtRef.current = null
      return
    }
    const visibleAt = loadingVisibleAtRef.current ?? performance.now()
    const elapsed = performance.now() - visibleAt
    const hide = () => {
      stopTimerRef.current = null
      loadingVisibleAtRef.current = null
      setVisibleLoading(false)
    }
    if (elapsed < LIST_LOADING_MIN_VISIBLE) {
      stopTimerRef.current = window.setTimeout(hide, LIST_LOADING_MIN_VISIBLE - elapsed)
      return
    }
    hide()
  }

  return { pending, loading, start, stop }
}

function LoadingStrip({ label = '正在刷新列表' }: { label?: string }) {
  return (
    <div className="loading-strip" aria-live="polite">
      <span className="mini-spinner" />
      <span>{label}</span>
    </div>
  )
}

function ListViewport({
  ready,
  pending,
  loading,
  children,
  skeleton = false,
}: {
  ready: boolean
  pending: boolean
  loading: boolean
  children: ReactNode
  skeleton?: boolean
}) {
  if (!ready && pending) {
    return skeleton && loading ? <SkeletonTable /> : <div className="list-placeholder" aria-hidden="true" />
  }
  return (
    <div className="list-viewport" aria-busy={pending}>
      {loading ? <LoadingStrip /> : null}
      {children}
    </div>
  )
}

const navItems: { path: RouteKey; label: string; icon: string; permission?: string }[] = [
  { path: '/', label: '管理概览', icon: 'dashboard' },
  { path: '/admins', label: '管理员管理', icon: 'admin_panel_settings', permission: 'admin:manage' },
  { path: '/departments', label: '部门管理', icon: 'corporate_fare', permission: 'dept:manage' },
  { path: '/public-reservations', label: '社会公众预约', icon: 'event_available', permission: 'public:query' },
  { path: '/official-reservations', label: '公务预约管理', icon: 'verified_user', permission: 'official:query' },
  { path: '/official-statistics', label: '公务预约统计', icon: 'analytics', permission: 'official:query' },
  { path: '/audit-logs', label: '审计日志', icon: 'history_edu', permission: 'audit:query' },
]

function visibleNavItems(session?: LoginResponse | null) {
  const permissions = new Set(session?.permissions ?? [])
  return navItems.filter((item) => !item.permission || permissions.has(item.permission))
}

function canAccessRoute(path: RouteKey, session?: LoginResponse | null) {
  return visibleNavItems(session).some((item) => item.path === path)
}

function fallbackRoute(session?: LoginResponse | null) {
  return visibleNavItems(session)[0]?.path ?? '/'
}

function App() {
  const [route, setRoute] = useState<RouteKey>(() => normalizeRoute(location.pathname))
  const [session, setSession] = useState<LoginResponse | null>(() => {
    const cached = localStorage.getItem(userKey)
    return cached ? JSON.parse(cached) : null
  })
  const [checking, setChecking] = useState(Boolean(localStorage.getItem(tokenKey)))
  const [toast, setToast] = useState<string>()

  useEffect(() => {
    const onPop = () => setRoute(normalizeRoute(location.pathname))
    addEventListener('popstate', onPop)
    return () => removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    if (!localStorage.getItem(tokenKey)) return
    request<LoginStatus>('/api/admin/auth/status')
      .then((status) => {
        if (!status.login) logout()
      })
      .catch((error) => {
        if (error instanceof ApiError && error.code === 401) {
          logout()
        } else {
          setToast(error instanceof Error ? error.message : '登录状态校验失败')
        }
      })
      .finally(() => setChecking(false))
  }, [])

  useEffect(() => {
    if (!session || canAccessRoute(route, session)) return
    const next = fallbackRoute(session)
    history.replaceState(null, '', next)
    setRoute(next)
    setToast('当前账号无权访问该页面，已切换到可访问菜单')
  }, [route, session])

  function navigate(path: RouteKey) {
    history.pushState(null, '', path)
    setRoute(path)
  }

  function logout() {
    localStorage.removeItem(tokenKey)
    localStorage.removeItem(userKey)
    setSession(null)
    history.replaceState(null, '', '/')
    setRoute('/')
  }

  function handleError(error: unknown) {
    if (error instanceof ApiError && error.code === 401) {
      setToast('登录已过期，请重新登录')
      logout()
      return
    }
    setToast(error instanceof Error ? error.message : '操作失败')
  }

  if (checking) return <LoadingPage />

  if (!session) {
    return (
      <LoginPage
        onLogin={(value) => {
          localStorage.setItem(tokenKey, value.tokenValue)
          localStorage.setItem(userKey, JSON.stringify(value))
          setSession(value)
          setRoute('/')
          history.replaceState(null, '', '/')
        }}
      />
    )
  }

  const currentRoute = canAccessRoute(route, session) ? route : fallbackRoute(session)

  return (
    <Shell route={currentRoute} session={session} navigate={navigate} logout={logout} toast={toast} clearToast={() => setToast(undefined)}>
      {currentRoute === '/' && <DashboardPage onError={handleError} navigate={navigate} />}
      {currentRoute === '/admins' && <AdminsPage onError={handleError} />}
      {currentRoute === '/departments' && <DepartmentsPage onError={handleError} />}
      {currentRoute === '/public-reservations' && <ReservationsPage type="public" onError={handleError} />}
      {currentRoute === '/official-reservations' && <ReservationsPage type="official" onError={handleError} />}
      {currentRoute === '/official-statistics' && <StatisticsPage onError={handleError} />}
      {currentRoute === '/audit-logs' && <AuditLogsPage onError={handleError} />}
    </Shell>
  )
}

function normalizeRoute(path: string): RouteKey {
  return navItems.some((item) => item.path === path) ? (path as RouteKey) : '/'
}

function Icon({ name }: { name: string }) {
  return <span className="material-symbols-outlined">{name}</span>
}

function LoginPage({ onLogin }: { onLogin: (value: LoginResponse) => void }) {
  const [loginName, setLoginName] = useState('admin')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  async function submit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(undefined)
    try {
      const data = await request<LoginResponse>('/api/admin/auth/login', json({ loginName, password }))
      onLogin(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-screen">
      <div className="login-bg" />
      <nav className="login-nav">
        <strong>Academic Secure Pass</strong>
        <div>
          <Icon name="help_outline" />
          <Icon name="dark_mode" />
        </div>
      </nav>
      <form className="login-card" onSubmit={submit}>
        <div className="brand-mark">
          <Icon name="shield_person" />
        </div>
        <h1>校园通行码预约管理系统</h1>
        <p>管理后台 · 安全访问控制</p>
        <label>
          <span>Login Name</span>
          <div className="field-with-icon">
            <Icon name="person" />
            <input value={loginName} onChange={(event) => setLoginName(event.target.value)} placeholder="请输入管理员账号" />
          </div>
        </label>
        <label>
          <span>Password</span>
          <div className="field-with-icon">
            <Icon name="lock" />
            <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="请输入您的密码" type={visible ? 'text' : 'password'} />
            <button className="ghost-icon" type="button" onClick={() => setVisible((value) => !value)}>
              <Icon name={visible ? 'visibility_off' : 'visibility'} />
            </button>
          </div>
        </label>
        <label className="checkbox-row">
          <input type="checkbox" defaultChecked />
          <span>Remember Me</span>
        </label>
        {error && <div className="form-error">{error}</div>}
        <button className="primary wide" disabled={loading} type="submit">
          {loading ? '登录中...' : '登录'}
          <Icon name="login" />
        </button>
      </form>
      <footer className="login-footer">© 2024 University Campus Security. All rights reserved.</footer>
    </main>
  )
}

function Shell({
  route,
  session,
  navigate,
  logout,
  toast,
  clearToast,
  children,
}: {
  route: RouteKey
  session: LoginResponse
  navigate: (route: RouteKey) => void
  logout: () => void
  toast?: string
  clearToast: () => void
  children: ReactNode
}) {
  const items = visibleNavItems(session)
  const active = items.find((item) => item.path === route) ?? items[0] ?? navItems[0]
  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Icon name="school" />
          <div>
            <strong>校园通行</strong>
            <span>Management System</span>
          </div>
        </div>
        <nav>
          {items.map((item) => (
            <button className={item.path === route ? 'active' : ''} key={item.path} onClick={() => navigate(item.path)}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <section className="workspace">
        <header className="topbar">
          <div>
            <span className="crumb">Campus Security Management</span>
            <h2>{active.label}</h2>
          </div>
          <div className="top-actions">
            <button className="icon-button"><Icon name="search" /></button>
            <button className="icon-button"><Icon name="notifications" /></button>
            <div className="user-pill">
              <span>{session.displayName?.slice(0, 1) || 'A'}</span>
              <div>
                <strong>{session.displayName || '管理员'}</strong>
                <small>{session.roles?.join(', ') || 'Admin'}</small>
              </div>
            </div>
            <button className="secondary" onClick={logout}>退出</button>
          </div>
        </header>
        <div className="page">{children}</div>
      </section>
      {toast && <ErrorPopover message={toast} onClose={clearToast} />}
    </div>
  )
}

function ErrorPopover({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <aside className="error-popover" role="alert" aria-live="assertive">
      <span className="error-popover-icon"><Icon name="error" /></span>
      <div>
        <strong>操作失败</strong>
        <p>{message}</p>
      </div>
      <button className="error-popover-close" type="button" aria-label="关闭错误提示" onClick={onClose}>
        <Icon name="close" />
      </button>
    </aside>
  )
}

function LoadingPage() {
  return (
    <div className="state-page">
      <div className="spinner" />
      <h1>正在恢复登录状态</h1>
      <p>请稍候，系统正在校验后台会话。</p>
    </div>
  )
}

function EmptyState({ title = '暂无数据', description = '当前筛选条件下没有记录。' }) {
  return (
    <div className="empty-state">
      <Icon name="inbox" />
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  )
}

function SkeletonTable() {
  return (
    <div className="skeleton-list">
      {Array.from({ length: 6 }).map((_, index) => (
        <div className="skeleton-row" key={index} />
      ))}
    </div>
  )
}

function MetricCard({ icon, label, value, hint }: { icon: string; label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="metric-card">
      <div className="metric-icon"><Icon name={icon} /></div>
      <span>{label}</span>
      <strong>{value}</strong>
      {hint && <small>{hint}</small>}
    </div>
  )
}

function StatusBadge({ value }: { value?: string }) {
  return <span className={`badge ${badgeTone(value)}`}>{statusText(value)}</span>
}

function Pager({ page, size, total, onPage }: { page: number; size: number; total: number; onPage: (page: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / size))
  return (
    <div className="pager">
      <span>显示第 {page} 页，共 {total} 条记录</span>
      <div>
        <button disabled={page <= 1} onClick={() => onPage(page - 1)}><Icon name="chevron_left" /></button>
        <strong>{page}</strong>
        <button disabled={page >= totalPages} onClick={() => onPage(page + 1)}><Icon name="chevron_right" /></button>
      </div>
    </div>
  )
}

function DashboardPage({ onError, navigate }: { onError: (error: unknown) => void; navigate: (route: RouteKey) => void }) {
  const [data, setData] = useState<DashboardSummary>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    request<DashboardSummary>('/api/admin/dashboard/summary')
      .then(setData)
      .catch(onError)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <SkeletonTable />
  if (!data) return <EmptyState title="概览加载失败" />

  const maxTrend = Math.max(...data.visitTrend.map((item) => item.peopleCount), 1)

  return (
    <>
      <section className="metrics-grid">
        <MetricCard icon="today" label="今日预约" value={data.todayReservations} hint="Today's Reservations" />
        <MetricCard icon="pending_actions" label="待审核" value={data.pendingApprovals} hint="High Priority" />
        <MetricCard icon="groups" label="本月预约人次" value={data.monthVisitors} />
        <MetricCard icon="apartment" label="启用部门" value={data.activeDepartments} />
      </section>

      <section className="two-column">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Recent Official Reservation Requests</h3>
              <p>最近公务预约申请</p>
            </div>
            <button className="link-button" onClick={() => navigate('/official-reservations')}>View All</button>
          </div>
          <ReservationTable records={data.recentOfficialReservations} mode="compact" />
        </div>
        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Traffic Insights</h3>
              <p>近 7 天访客趋势</p>
            </div>
            <Icon name="insights" />
          </div>
          <div className="trend-bars">
            {data.visitTrend.map((item) => (
              <div key={item.date}>
                <span style={{ height: `${Math.max(12, (item.peopleCount / maxTrend) * 150)}px` }} />
                <small>{item.date.slice(5)}</small>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

function DepartmentsPage({ onError }: { onError: (error: unknown) => void }) {
  const [query, setQuery] = useState({ keyword: '', deptType: '', status: '', page: 1, size: 10 })
  const [page, setPage] = useState<PageResponse<Department>>()
  const [editing, setEditing] = useState<Partial<Department> | null>(null)
  const requestSeq = useRef(0)
  const { pending, loading, start, stop } = useDeferredLoading()

  function load(next = query) {
    const requestId = ++requestSeq.current
    start()
    request<PageResponse<Department>>(`/api/admin/departments${params(next)}`)
      .then((data) => {
        if (requestId === requestSeq.current) {
          setPage(data)
        }
      })
      .catch((error) => {
        if (requestId === requestSeq.current) {
          onError(error)
        }
      })
      .finally(() => {
        if (requestId === requestSeq.current) {
          stop()
        }
      })
  }

  useEffect(() => {
    void load()
  }, [])

  async function saveDepartment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const body = {
      deptCode: String(form.get('deptCode') || ''),
      deptName: String(form.get('deptName') || ''),
      deptType: String(form.get('deptType') || ''),
      status: form.get('status') ? 'ENABLED' : 'DISABLED',
    }
    try {
      if (editing?.id) {
        await request(`/api/admin/departments/${editing.id}`, put(body))
      } else {
        await request('/api/admin/departments', json(body))
      }
      setEditing(null)
      load()
    } catch (error) {
      onError(error)
    }
  }

  async function toggleStatus(dept: Department) {
    try {
      await request(`/api/admin/departments/${dept.id}/status`, put({ status: dept.status === 'ENABLED' ? 'DISABLED' : 'ENABLED' }))
      load()
    } catch (error) {
      onError(error)
    }
  }

  const records = page?.records ?? []

  return (
    <>
      <section className="metrics-grid">
        <MetricCard icon="domain" label="总部门数" value={page?.total ?? 0} />
        <MetricCard icon="school" label="学院" value={records.filter((item) => item.deptType === '学院').length} />
        <MetricCard icon="admin_panel_settings" label="行政部门" value={records.filter((item) => item.deptType === '行政部门').length} />
      </section>
      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>部门管理</h3>
            <p>Configure and manage institutional organizational structures.</p>
          </div>
          <button className="primary" onClick={() => setEditing({ status: 'ENABLED' })}><Icon name="add" />新增部门</button>
        </div>
        <div className="filters">
          <input placeholder="部门名称或编号" value={query.keyword} onChange={(event) => setQuery({ ...query, keyword: event.target.value })} />
          <select value={query.deptType} onChange={(event) => setQuery({ ...query, deptType: event.target.value })}>
            <option value="">全部类型</option>
            <option value="行政部门">行政部门</option>
            <option value="直属部门">直属部门</option>
            <option value="学院">学院</option>
          </select>
          <select value={query.status} onChange={(event) => setQuery({ ...query, status: event.target.value })}>
            <option value="">全部状态</option>
            <option value="ENABLED">启用</option>
            <option value="DISABLED">禁用</option>
          </select>
          <button className="secondary" onClick={() => load({ ...query, page: 1 })}><Icon name="filter_list" />筛选</button>
        </div>
        <ListViewport ready={Boolean(page)} pending={pending} loading={loading}>
            {records.length === 0 ? <EmptyState /> : (
              <table>
                <thead><tr><th>Dept ID</th><th>Type</th><th>Dept Name</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {records.map((dept) => (
                    <tr key={dept.id}>
                      <td>{dept.deptCode}</td>
                      <td>{dept.deptType}</td>
                      <td>{dept.deptName}</td>
                      <td><StatusBadge value={dept.status} /></td>
                      <td className="table-actions">
                        <button onClick={() => setEditing(dept)}><Icon name="edit" /></button>
                        <button onClick={() => toggleStatus(dept)}><Icon name={dept.status === 'ENABLED' ? 'block' : 'check_circle'} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </ListViewport>
        {page && <Pager page={page.page} size={page.size} total={page.total} onPage={(next) => { const value = { ...query, page: next }; setQuery(value); load(value) }} />}
      </div>
      {editing && (
        <Modal title={editing.id ? '编辑部门' : '新增部门'} onClose={() => setEditing(null)}>
          <form className="modal-form" onSubmit={saveDepartment}>
            <label>部门编号<input name="deptCode" defaultValue={editing.deptCode} required /></label>
            <label>部门名称<input name="deptName" defaultValue={editing.deptName} required /></label>
            <label>部门类型<select name="deptType" defaultValue={editing.deptType || '行政部门'}><option>行政部门</option><option>直属部门</option><option>学院</option></select></label>
            <label className="switch-row"><input name="status" type="checkbox" defaultChecked={editing.status !== 'DISABLED'} />启用部门</label>
            <div className="modal-actions"><button className="secondary" type="button" onClick={() => setEditing(null)}>取消</button><button className="primary" type="submit">保存</button></div>
          </form>
        </Modal>
      )}
    </>
  )
}

function AdminsPage({ onError }: { onError: (error: unknown) => void }) {
  const [query, setQuery] = useState({ keyword: '', page: 1, size: 10 })
  const [page, setPage] = useState<PageResponse<AdminUser>>()
  const [departments, setDepartments] = useState<Department[]>([])
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [editing, setEditing] = useState<Partial<AdminUser> | null>(null)
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null)
  const requestSeq = useRef(0)
  const { pending, loading, start, stop } = useDeferredLoading()

  function load(next = query) {
    const requestId = ++requestSeq.current
    start()
    request<PageResponse<AdminUser>>(`/api/admin/admins${params(next)}`)
      .then((admins) => {
        if (requestId !== requestSeq.current) return
        setPage(admins)
      })
      .catch((error) => {
        if (requestId === requestSeq.current) {
          onError(error)
        }
      })
      .finally(() => {
        if (requestId === requestSeq.current) {
          stop()
        }
      })
  }

  useEffect(() => {
    void load()
    Promise.all([
      request<PageResponse<Department>>('/api/admin/departments?page=1&size=100'),
      request<RoleOption[]>('/api/admin/admins/roles'),
    ])
      .then(([deptPage, roleOptions]) => {
        setDepartments(deptPage.records)
        setRoles(roleOptions)
      })
      .catch(onError)
  }, [])

  async function saveAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const roleIds = form.getAll('roleIds').map((value) => Number(value))
    const body = {
      realName: String(form.get('realName') || ''),
      loginName: String(form.get('loginName') || ''),
      password: String(form.get('password') || ''),
      deptId: Number(form.get('deptId') || 0) || undefined,
      phone: String(form.get('phone') || ''),
      roleIds,
      authScope: String(form.get('authScope') || ''),
      accountStatus: String(form.get('accountStatus') || 'NORMAL'),
    }
    try {
      if (editing?.id) {
        const { password, ...updateBody } = body
        void password
        await request(`/api/admin/admins/${editing.id}`, put(updateBody))
      } else {
        await request('/api/admin/admins', json(body))
      }
      setEditing(null)
      load()
    } catch (error) {
      onError(error)
    }
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!resetTarget) return
    const form = new FormData(event.currentTarget)
    try {
      await request(`/api/admin/admins/${resetTarget.id}/password`, put({ newPassword: String(form.get('newPassword') || '') }))
      setResetTarget(null)
      load()
    } catch (error) {
      onError(error)
    }
  }

  const records = page?.records ?? []

  return (
    <div className="panel">
      <div className="panel-head">
        <div><h3>Administrator Management</h3><p>Manage system access levels and user roles.</p></div>
        <button className="primary" onClick={() => setEditing({ accountStatus: 'NORMAL', roleIds: [] })}><Icon name="person_add" />新增管理员</button>
      </div>
      <div className="filters">
        <input placeholder="姓名或登录名" value={query.keyword} onChange={(event) => setQuery({ ...query, keyword: event.target.value })} />
        <button className="secondary" onClick={() => load({ ...query, page: 1 })}><Icon name="search" />查询</button>
      </div>
      <ListViewport ready={Boolean(page)} pending={pending} loading={loading}>
          {records.length === 0 ? <EmptyState /> : (
            <table>
              <thead><tr><th>管理员编号</th><th>姓名</th><th>登录名</th><th>角色</th><th>所属部门</th><th>状态</th><th>操作</th></tr></thead>
              <tbody>
                {records.map((admin) => (
                  <tr key={admin.id}>
                    <td>{admin.adminNo}</td>
                    <td>{admin.realName}</td>
                    <td>{admin.loginName}</td>
                    <td>{admin.roleCodes?.join(', ') || '-'}</td>
                    <td>{departments.find((dept) => dept.id === admin.deptId)?.deptName || '-'}</td>
                    <td><StatusBadge value={admin.accountStatus} /></td>
                    <td className="table-actions">
                      <button onClick={() => setEditing(admin)}><Icon name="edit" /></button>
                      <button onClick={() => setResetTarget(admin)}><Icon name="lock_reset" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </ListViewport>
      {page && <Pager page={page.page} size={page.size} total={page.total} onPage={(next) => { const value = { ...query, page: next }; setQuery(value); load(value) }} />}
      {editing && (
        <Modal title={editing.id ? '编辑管理员' : '新增管理员'} onClose={() => setEditing(null)}>
          <form className="modal-form" onSubmit={saveAdmin}>
            <label>真实姓名<input name="realName" defaultValue={editing.realName} required /></label>
            <label>登录名<input name="loginName" defaultValue={editing.loginName} required /></label>
            {!editing.id && <label>初始密码<input name="password" defaultValue="" required type="password" /></label>}
            <label>联系电话<input name="phone" defaultValue={editing.phone?.replace(/\*/g, '')} /></label>
            <label>所在部门<select name="deptId" defaultValue={editing.deptId}><option value="">未选择</option>{departments.map((dept) => <option key={dept.id} value={dept.id}>{dept.deptName}</option>)}</select></label>
            <label>授权范围<select name="authScope" defaultValue={editing.authScope || 'ALL'}><option value="ALL">全部权限</option><option value="ALL_OFFICIAL">全部公务预约</option><option value="DEPT_ONLY">本部门</option></select></label>
            <label>账号状态<select name="accountStatus" defaultValue={editing.accountStatus || 'NORMAL'}><option value="NORMAL">正常</option><option value="DISABLED">禁用</option><option value="LOCKED">锁定</option></select></label>
            <div className="check-field">
              <span className="field-label">角色</span>
              <div className="check-grid">
                {roles.map((role) => (
                  <label className="check-option" key={role.id}>
                    <input name="roleIds" type="checkbox" value={role.id} defaultChecked={editing.roleIds?.includes(role.id)} />
                    <span>{role.roleName}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-actions"><button className="secondary" type="button" onClick={() => setEditing(null)}>取消</button><button className="primary" type="submit">保存</button></div>
          </form>
        </Modal>
      )}
      {resetTarget && (
        <Modal title={`重置 ${resetTarget.realName} 的密码`} onClose={() => setResetTarget(null)}>
          <form className="modal-form" onSubmit={resetPassword}>
            <label>新密码<input name="newPassword" defaultValue="Admin123!" required type="password" /></label>
            <div className="modal-actions"><button className="secondary" type="button" onClick={() => setResetTarget(null)}>取消</button><button className="primary" type="submit">确认重置</button></div>
          </form>
        </Modal>
      )}
    </div>
  )
}

function ReservationsPage({ type, onError }: { type: 'public' | 'official'; onError: (error: unknown) => void }) {
  const [query, setQuery] = useState({
    visitorName: '',
    idCard: '',
    organization: '',
    applyDate: '',
    visitDate: '',
    campusId: '',
    visitDeptId: '',
    receptionist: '',
    approvalStatus: '',
    page: 1,
    size: 10,
  })
  const [pageState, setPageState] = useState<{ type: 'public' | 'official'; page: PageResponse<ReservationListItem> }>()
  const [detail, setDetail] = useState<ReservationDetail | null>(null)
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const requestSeq = useRef(0)
  const { pending, loading, start, stop } = useDeferredLoading()
  const endpoint = type === 'public' ? 'public-reservations' : 'official-reservations'
  const page = pageState?.type === type ? pageState.page : undefined

  function queryParams(next = query) {
    return params({
      page: next.page,
      size: next.size,
      visitorName: next.visitorName,
      idCard: next.idCard,
      organization: next.organization,
      campusId: next.campusId,
      visitDeptId: next.visitDeptId,
      receptionist: next.receptionist,
      approvalStatus: next.approvalStatus,
      applyStart: toStart(next.applyDate),
      applyEnd: toEnd(next.applyDate),
      visitStart: toStart(next.visitDate),
      visitEnd: toEnd(next.visitDate),
    })
  }

  function load(next = query) {
    const requestId = ++requestSeq.current
    const requestType = type
    start()
    request<PageResponse<ReservationListItem>>(`/api/admin/${endpoint}${queryParams(next)}`)
      .then((reservations) => {
        if (requestId !== requestSeq.current) return
        setPageState({ type: requestType, page: reservations })
      })
      .catch((error) => {
        if (requestId === requestSeq.current) {
          onError(error)
        }
      })
      .finally(() => {
        if (requestId === requestSeq.current) {
          stop()
        }
      })
  }

  useEffect(() => {
    Promise.all([
      request<Campus[]>('/api/mobile/campuses'),
      request<PageResponse<Department>>('/api/admin/departments?page=1&size=100&status=ENABLED'),
    ])
      .then(([campusOptions, deptPage]) => {
        setCampuses(campusOptions)
        setDepartments(deptPage.records)
      })
      .catch(onError)
  }, [])

  useEffect(() => {
    void load(query)
  }, [type])

  async function openDetail(id: number) {
    try {
      setDetail(await request<ReservationDetail>(`/api/admin/${endpoint}/${id}`))
    } catch (error) {
      onError(error)
    }
  }

  async function approve(result: 'APPROVED' | 'REJECTED', rejectReason?: string) {
    if (!detail) return
    try {
      const updated = await request<ReservationDetail>(`/api/admin/official-reservations/${detail.id}/approval`, json({ result, rejectReason }))
      setDetail(updated)
      load()
    } catch (error) {
      onError(error)
    }
  }

  return (
    <>
      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>{type === 'public' ? '社会公众预约管理' : '公务预约管理'}</h3>
            <p>{type === 'public' ? '管理校外人员进出校预约申请。' : '查询、审核和统计公务预约记录。'}</p>
          </div>
          {type === 'public' ? <button className="secondary"><Icon name="download" />导出申请列表</button> : <a className="primary as-link" href="/official-statistics"><Icon name="analytics" />统计分析</a>}
        </div>
        <div className="filters">
          <input placeholder="预约人姓名" value={query.visitorName} onChange={(event) => setQuery({ ...query, visitorName: event.target.value })} />
          <input placeholder="身份证号" value={query.idCard} onChange={(event) => setQuery({ ...query, idCard: event.target.value })} />
          <input placeholder="所在单位" value={query.organization} onChange={(event) => setQuery({ ...query, organization: event.target.value })} />
          <label>申请日期<input type="date" value={query.applyDate} onChange={(event) => setQuery({ ...query, applyDate: event.target.value })} /></label>
          <label>预约日期<input type="date" value={query.visitDate} onChange={(event) => setQuery({ ...query, visitDate: event.target.value })} /></label>
          <select value={query.campusId} onChange={(event) => setQuery({ ...query, campusId: event.target.value })}>
            <option value="">全部校区</option>
            {campuses.map((campus) => <option key={campus.id} value={campus.id}>{campus.campusName}</option>)}
          </select>
          {type === 'official' && (
            <>
              <select value={query.visitDeptId} onChange={(event) => setQuery({ ...query, visitDeptId: event.target.value })}>
                <option value="">全部部门</option>
                {departments.map((dept) => <option key={dept.id} value={dept.id}>{dept.deptName}</option>)}
              </select>
              <input placeholder="接待人" value={query.receptionist} onChange={(event) => setQuery({ ...query, receptionist: event.target.value })} />
              <select value={query.approvalStatus} onChange={(event) => setQuery({ ...query, approvalStatus: event.target.value })}>
                <option value="">全部状态</option>
                <option value="PENDING">待审核</option>
                <option value="APPROVED">已通过</option>
                <option value="REJECTED">已拒绝</option>
              </select>
            </>
          )}
          <button className="secondary" onClick={() => { const value = { ...query, page: 1 }; setQuery(value); load(value) }}><Icon name="filter_list" />查询</button>
        </div>
        <ListViewport ready={Boolean(page)} pending={pending} loading={loading}>
          <ReservationTable records={page?.records ?? []} onDetail={openDetail} mode={type} />
        </ListViewport>
        {page && <Pager page={page.page} size={page.size} total={page.total} onPage={(next) => { const value = { ...query, page: next }; setQuery(value); load(value) }} />}
      </div>
      {detail && <ReservationDrawer detail={detail} type={type} onClose={() => setDetail(null)} onApprove={approve} />}
    </>
  )
}

function ReservationTable({ records, onDetail, mode }: { records: ReservationListItem[]; onDetail?: (id: number) => void; mode: 'public' | 'official' | 'compact' }) {
  if (records.length === 0) return <EmptyState />
  return (
    <table>
      <thead>
        <tr>
          <th>预约编号</th><th>申请人</th><th>预约校区</th><th>预约进校时间</th>{mode !== 'public' && <th>访问部门</th>}<th>状态</th><th>操作</th>
        </tr>
      </thead>
      <tbody>
        {records.map((item) => (
          <tr key={item.id}>
            <td>{item.reservationNo}</td>
            <td><strong>{item.visitorName}</strong><small>{item.organization}</small></td>
            <td>{item.campusName}</td>
            <td>{fmt(item.visitTime)}</td>
            {mode !== 'public' && <td>{item.visitDeptName || '-'}</td>}
            <td><StatusBadge value={item.approvalStatus} /></td>
            <td className="table-actions">{onDetail && <button onClick={() => onDetail(item.id)}>Details</button>}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function ReservationDrawer({ detail, type, onClose, onApprove }: { detail: ReservationDetail; type: 'public' | 'official'; onClose: () => void; onApprove: (result: 'APPROVED' | 'REJECTED', rejectReason?: string) => void }) {
  const [rejectReason, setRejectReason] = useState('')
  return (
    <div className="drawer-backdrop">
      <aside className="drawer">
        <div className="drawer-head">
          <div><h3>{type === 'public' ? '预约详情' : '公务预约详情'}</h3><p>预约编号：{detail.reservationNo}</p></div>
          <button className="icon-button" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="detail-grid">
          <Info label="姓名" value={detail.visitorName} />
          <Info label="证件号码" value={detail.idCard} />
          <Info label="所在单位" value={detail.organization} />
          <Info label="联系电话" value={detail.phone} />
          <Info label="预约校区" value={detail.campusName} />
          <Info label="预约时间" value={fmt(detail.visitTime)} />
          <Info label="交通方式" value={detail.trafficType} />
          <Info label="车牌号" value={detail.plateNo || '-'} />
          {type === 'official' && <Info label="接待部门" value={detail.visitDeptName || '-'} />}
          {type === 'official' && <Info label="接待人" value={detail.receptionist || '-'} />}
        </div>
        {detail.visitReason && <div className="detail-block"><strong>来访事由</strong><p>{detail.visitReason}</p></div>}
        <div className="detail-block"><strong>随行人员 ({detail.companions?.length || 0})</strong>{detail.companions?.length ? detail.companions.map((item) => <p key={item.id}>{item.name} · {item.phone}</p>) : <p>无随行人员</p>}</div>
        <div className="detail-block"><strong>审核状态</strong><p><StatusBadge value={detail.approvalStatus} /> {detail.rejectReason || ''}</p></div>
        {type === 'official' && detail.approvalStatus === 'PENDING' && (
          <div className="approval-box">
            <button className="success-button" onClick={() => onApprove('APPROVED')}><Icon name="check_circle" />审核通过</button>
            <textarea placeholder="拒绝原因" value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} />
            <button className="danger-button" onClick={() => onApprove('REJECTED', rejectReason)}><Icon name="cancel" />审核拒绝</button>
          </div>
        )}
      </aside>
    </div>
  )
}

function StatisticsPage({ onError }: { onError: (error: unknown) => void }) {
  const [campus, setCampus] = useState<StatItem[]>([])
  const [dept, setDept] = useState<StatItem[]>([])
  const [month, setMonth] = useState<StatItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      request<StatItem[]>('/api/admin/official-reservations/statistics?dimension=campus'),
      request<StatItem[]>('/api/admin/official-reservations/statistics?dimension=dept'),
      request<StatItem[]>('/api/admin/official-reservations/statistics?dimension=visitMonth'),
    ])
      .then(([campusData, deptData, monthData]) => {
        setCampus(campusData)
        setDept(deptData)
        setMonth(monthData)
      })
      .catch(onError)
      .finally(() => setLoading(false))
  }, [])

  const total = campus.reduce((sum, item) => sum + item.peopleCount, 0)
  const maxDept = Math.max(...dept.map((item) => item.peopleCount), 1)

  if (loading) return <SkeletonTable />

  return (
    <>
      <section className="metrics-grid">
        <MetricCard icon="groups" label="预约总人次" value={total} hint="全口径公务预约" />
        <MetricCard icon="verified" label="统计维度" value="3" hint="月度 / 校区 / 部门" />
        <MetricCard icon="hub" label="活跃部门" value={dept.length} hint="有预约记录部门" />
      </section>
      <section className="two-column">
        <StatPanel title="校区占比分析" data={campus} />
        <StatPanel title="月度预约趋势" data={month} />
      </section>
      <div className="panel">
        <div className="panel-head"><div><h3>部门预约人次排名</h3><p>Top 活跃业务部门统计</p></div><button className="secondary"><Icon name="download" />导出分析报告</button></div>
        <div className="rank-list">
          {dept.map((item) => <div key={item.dimensionValue}><span>{item.dimensionValue}</span><strong>{item.peopleCount} 人次</strong><i style={{ width: `${(item.peopleCount / maxDept) * 100}%` }} /></div>)}
        </div>
      </div>
    </>
  )
}

function StatPanel({ title, data }: { title: string; data: StatItem[] }) {
  const max = Math.max(...data.map((item) => item.peopleCount), 1)
  return (
    <div className="panel">
      <div className="panel-head"><div><h3>{title}</h3><p>预约次数与人次</p></div></div>
      <div className="rank-list">
        {data.length === 0 ? <EmptyState /> : data.map((item) => (
          <div key={item.dimensionValue}><span>{item.dimensionValue}</span><strong>{item.peopleCount} 人次 / {item.reservationCount} 次</strong><i style={{ width: `${(item.peopleCount / max) * 100}%` }} /></div>
        ))}
      </div>
    </div>
  )
}

function AuditLogsPage({ onError }: { onError: (error: unknown) => void }) {
  const [query, setQuery] = useState({ operatorName: '', operationType: '', result: '', startDate: '', endDate: '', page: 1, size: 10 })
  const [page, setPage] = useState<PageResponse<AuditLog>>()
  const [summary, setSummary] = useState<AuditSummary>()
  const [detail, setDetail] = useState<AuditLog | null>(null)
  const requestSeq = useRef(0)
  const { pending, loading, start, stop } = useDeferredLoading()

  function load(next = query) {
    const requestId = ++requestSeq.current
    start()
    request<PageResponse<AuditLog>>(`/api/admin/audit-logs${params({ page: next.page, size: next.size, operatorName: next.operatorName, operationType: next.operationType, result: next.result, startTime: toStart(next.startDate), endTime: toEnd(next.endDate) })}`)
      .then((logs) => {
        if (requestId === requestSeq.current) {
          setPage(logs)
        }
      })
      .catch((error) => {
        if (requestId === requestSeq.current) {
          onError(error)
        }
      })
      .finally(() => {
        if (requestId === requestSeq.current) {
          stop()
        }
      })
  }

  useEffect(() => {
    void load()
    request<AuditSummary>('/api/admin/audit-logs/summary')
      .then(setSummary)
      .catch(onError)
  }, [])

  return (
    <>
      <section className="metrics-grid">
        <MetricCard icon="groups" label="今日活跃管理员" value={summary ? summary.todayActiveAdminCount : '...'} />
        <MetricCard icon="rule" label="今日操作总数" value={summary ? summary.todayOperationCount : '...'} />
        <MetricCard icon="warning" label="高危异常告警" value={summary ? summary.warningCount : '...'} hint={summary ? `${summary.warningRatePerSecond} 次/秒` : undefined} />
      </section>
      <div className="panel">
        <div className="panel-head"><div><h3>审计日志</h3><p>关键操作全链路审计。</p></div><button className="secondary"><Icon name="download" />导出报表</button></div>
        <div className="filters">
          <label>开始日期<input type="date" value={query.startDate} onChange={(event) => setQuery({ ...query, startDate: event.target.value })} /></label>
          <label>结束日期<input type="date" value={query.endDate} onChange={(event) => setQuery({ ...query, endDate: event.target.value })} /></label>
          <input placeholder="操作人员" value={query.operatorName} onChange={(event) => setQuery({ ...query, operatorName: event.target.value })} />
          <input placeholder="操作类型" value={query.operationType} onChange={(event) => setQuery({ ...query, operationType: event.target.value })} />
          <select value={query.result} onChange={(event) => setQuery({ ...query, result: event.target.value })}><option value="">全部状态</option><option value="SUCCESS">成功</option><option value="FAIL">失败</option></select>
          <button className="secondary" onClick={() => { const value = { ...query, page: 1 }; setQuery(value); load(value) }}><Icon name="search" />执行筛选</button>
        </div>
        <ListViewport ready={Boolean(page)} pending={pending} loading={loading}>
            {page?.records.length ? (
              <table>
                <thead><tr><th>日志 ID</th><th>操作员</th><th>操作内容</th><th>目标对象</th><th>IP 地址</th><th>发生时间</th><th>状态</th></tr></thead>
                <tbody>
                  {page.records.map((log) => (
                    <tr key={log.id} onClick={() => setDetail(log)}>
                      <td>L{log.id}</td><td>{log.operatorName || '-'}</td><td>{log.operationType}</td><td>{log.targetType}:{log.targetId}</td><td>{log.ipAddress || '-'}</td><td>{fmt(log.operationTime)}</td><td><StatusBadge value={log.result} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <EmptyState title="暂无审计记录" />}
        </ListViewport>
        {page && <Pager page={page.page} size={page.size} total={page.total} onPage={(next) => { const value = { ...query, page: next }; setQuery(value); load(value) }} />}
      </div>
      {detail && (
        <Modal title="审计日志详情" onClose={() => setDetail(null)}>
          <div className="detail-grid">
            <Info label="操作员" value={detail.operatorName || '-'} />
            <Info label="操作类型" value={detail.operationType} />
            <Info label="目标对象" value={`${detail.targetType || '-'}:${detail.targetId || '-'}`} />
            <Info label="IP 地址" value={detail.ipAddress || '-'} />
            <Info label="发生时间" value={fmt(detail.operationTime)} />
            <Info label="状态" value={statusText(detail.result)} />
          </div>
          <pre className="json-box">{detail.detailJson || '{}'}</pre>
        </Modal>
      )}
    </>
  )
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return <div className="info"><span>{label}</span><strong>{value}</strong></div>
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal-backdrop">
      <section className="modal">
        <header><h3>{title}</h3><button className="icon-button" onClick={onClose}><Icon name="close" /></button></header>
        {children}
      </section>
    </div>
  )
}

export default App
