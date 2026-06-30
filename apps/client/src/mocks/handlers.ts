import { http, HttpResponse, delay } from 'msw'

const API_BASE = '/api/v1'

let projects = [
  {
    publicId: 'proj-1',
    name: 'Project VF 1',
    description: 'QC Copilot project 1',
  },
  {
    publicId: 'proj-2',
    name: 'Project VF 2',
    description: 'QC Copilot project 2',
  }
]

export const handlers = [
  // Mock /auth/login
  http.post(`${API_BASE}/auth/login`, async () => {
    await delay(500)
    return HttpResponse.json({
      accessToken: 'mock-jwt-token-bypass-login',
      tokenType: 'Bearer',
      expiresInSeconds: 3600,
      user: {
        id: 1,
        email: 'mockuser@vinfast.vn',
        displayName: 'Mock User',
        role: 'ADMIN',
        avatarUrl: null
      }
    })
  }),

  // Mock /auth/refresh
  http.post(`${API_BASE}/auth/refresh`, async () => {
    await delay(300)
    return HttpResponse.json({
      accessToken: 'mock-jwt-token-bypass-login',
      tokenType: 'Bearer',
      expiresInSeconds: 3600,
      user: {
        id: 1,
        email: 'mockuser@vinfast.vn',
        displayName: 'Mock User',
        role: 'ADMIN',
        avatarUrl: null
      }
    })
  }),

  // Mock /auth/me
  http.get(`${API_BASE}/auth/me`, async () => {
    await delay(300)
    return HttpResponse.json({
      id: 1,
      email: 'mockuser@vinfast.vn',
      displayName: 'Mock User',
      role: 'ADMIN',
      avatarUrl: null
    })
  }),

  // GET /projects
  http.get(`${API_BASE}/projects`, async () => {
    await delay(500)
    return HttpResponse.json({
      content: projects,
      page: {
        size: 10,
        number: 0,
        totalElements: projects.length,
        totalPages: 1
      }
    })
  }),

  // POST /projects
  http.post(`${API_BASE}/projects`, async ({ request }) => {
    await delay(600)
    const body = await request.json() as any
    const newProject = {
      publicId: `proj-${Math.random().toString(36).substr(2, 6)}`,
      name: body.name || 'New Project',
      description: body.description || '',
    }
    // prepend to simulate latest created
    projects = [newProject, ...projects]
    return HttpResponse.json(newProject, { status: 201 })
  }),

  // GET /projects/:publicId
  http.get(`${API_BASE}/projects/:publicId`, async ({ params }) => {
    await delay(300)
    const project = projects.find(p => p.publicId === params.publicId)
    if (!project) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(project)
  }),

  // PATCH /projects/:publicId
  http.patch(`${API_BASE}/projects/:publicId`, async ({ params, request }) => {
    await delay(500)
    const body = await request.json() as any
    const index = projects.findIndex(p => p.publicId === params.publicId)
    if (index === -1) return new HttpResponse(null, { status: 404 })
    
    projects[index] = { ...projects[index], ...body }
    return HttpResponse.json(projects[index])
  }),

  // DELETE /projects/:publicId
  http.delete(`${API_BASE}/projects/:publicId`, async ({ params }) => {
    await delay(500)
    projects = projects.filter(p => p.publicId !== params.publicId)
    return new HttpResponse(null, { status: 204 })
  }),

  // GET /projects/:publicId/setup-status
  http.get(`${API_BASE}/projects/:publicId/setup-status`, async () => {
    await delay(300)
    return HttpResponse.json({
      hasTargetConfig: true,
      hasAiConfig: true,
      hasProjectSchema: true,
      hasVerification: false,
      hasDatasets: false
    })
  })
]
