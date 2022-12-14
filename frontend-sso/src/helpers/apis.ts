import {LateInit} from './utils'

export interface AuditLog {
  index: number;
  department: string;
  section: string;
  timeAgo: string;
  msg: string;
}

export interface Worker {
  name: string;
  department: string;
  phoneNumber: string;
  role: string;
  canAddAgents: boolean;
}

interface ListWorkers {
  users: {
    uniqueName: string;
    data: Worker;
  }[];
}

interface ListAuditLogs {
  auditLogs: AuditLog[];
}

const helperToken: LateInit<string> = new LateInit(
  () => new Error('HelperToken is not initialised'),
)

export const setHelperToken = (value: string) => helperToken.set(value)

export const apiListWorkers = async () => {
  try {
    const {users} = await request('/admin/worker-list') as ListWorkers
    return users.map(({data}) => data)
  } catch (e) {
    // @ts-ignore
    alert(e.message)
    return []
  }
}

export const apiListAuditLogs = async () => {
  try {
    const {auditLogs} = await request(`/admin/auditlogs-list`) as ListAuditLogs
    return auditLogs
  } catch (e) {
    // @ts-ignore
    alert(e.message)
    return []
  }
}

export const apiSaveWorker = async (name: string, phoneNumber: string) => {
  try {
    await request('/admin/worker-add', {name, phoneNumber})
    console.log(`Agent ${name} was added.`)
  } catch (e) {
    // @ts-ignore
    alert(e.message)
  }
}

export const apiDeleteWorker = async (phoneNumber: string) => {

  try {
    await request('/admin/worker-del', {phoneNumber})
    console.log(`Agent with the phoneNumber number '${phoneNumber}' has been deleted from our system.`)
  } catch (e) {
    // @ts-ignore
    alert(e.message)
  }
}

const request = async (path: string, params = {}) => {
  const {REACT_APP_SERVICE_BASE_URL} = process.env

  const url = `${REACT_APP_SERVICE_BASE_URL}${path}`

  const body = {
    ...params,
    helperToken: helperToken.get(),
  }

  const options = {
    method: 'POST',
    body: new URLSearchParams(body),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
  }

  const respRaw = await fetch(url, options)
  const resp = await respRaw.json()

  if (resp.error) {
    throw new Error(resp.error)
  }

  return resp
}
