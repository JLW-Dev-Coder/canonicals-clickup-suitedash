import 'dotenv/config';

const CU_API_BASE = 'https://api.clickup.com/api/v3';

function getToken(): string {
  const t = process.env.CLICKUP_API_TOKEN;
  if (!t) throw new Error('CLICKUP_API_TOKEN env var not set. See .env.example.');
  return t;
}
function getWorkspaceId(): string {
  const id = process.env.CLICKUP_WORKSPACE_ID;
  if (!id) throw new Error('CLICKUP_WORKSPACE_ID env var not set.');
  return id;
}
function getDocId(override?: string): string {
  const id = override || process.env.CLICKUP_TAX_PREP_DOC_ID;
  if (!id) throw new Error('CLICKUP_TAX_PREP_DOC_ID env var not set (and no docId override provided).');
  return id;
}

/**
 * Normalize a CU page name: em-dash → single dash. Body content keeps em-dashes.
 */
export function normalizePageName(name: string): string {
  return name.replace(/–/g, '-').replace(/—/g, '-');
}

export interface CUPage {
  id: string;
  name: string;
  content: string;
  parent_page_id?: string;
  date_updated: number;
}

export async function fetchPage(pageId: string): Promise<CUPage> {
  const res = await fetch(`${CU_API_BASE}/workspaces/${getWorkspaceId()}/docs/${getDocId()}/pages/${pageId}`, {
    headers: { Authorization: getToken(), 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`CU fetch failed: ${res.status} ${res.statusText} — ${await res.text()}`);
  return (await res.json()) as CUPage;
}

export async function updatePage(pageId: string, content: string, name?: string, docId?: string): Promise<void> {
  const body: Record<string, unknown> = { content, content_format: 'text/md' };
  if (name) body.name = normalizePageName(name);
  const res = await fetch(`${CU_API_BASE}/workspaces/${getWorkspaceId()}/docs/${getDocId(docId)}/pages/${pageId}`, {
    method: 'PUT',
    headers: { Authorization: getToken(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`CU update failed: ${res.status} ${res.statusText} — ${await res.text()}`);
}

export async function createPage(params: { parent_page_id: string; name: string; content: string; docId?: string }): Promise<CUPage> {
  const res = await fetch(`${CU_API_BASE}/workspaces/${getWorkspaceId()}/docs/${getDocId(params.docId)}/pages`, {
    method: 'POST',
    headers: { Authorization: getToken(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      parent_page_id: params.parent_page_id,
      name: normalizePageName(params.name),
      content: params.content,
      content_format: 'text/md',
    }),
  });
  if (!res.ok) throw new Error(`CU create failed: ${res.status} ${res.statusText} — ${await res.text()}`);
  return (await res.json()) as CUPage;
}

export async function listChildPages(parentPageId: string): Promise<CUPage[]> {
  const res = await fetch(
    `${CU_API_BASE}/workspaces/${getWorkspaceId()}/docs/${getDocId()}/pages?parent_page_id=${parentPageId}`,
    { headers: { Authorization: getToken(), 'Content-Type': 'application/json' } }
  );
  if (!res.ok) throw new Error(`CU list failed: ${res.status} ${res.statusText} — ${await res.text()}`);
  return (await res.json()) as CUPage[];
}
