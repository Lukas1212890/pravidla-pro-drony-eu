export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
}

export const extractDocIdFromUrl = (urlOrId: string): string => {
  const trimmed = urlOrId.trim();
  
  // Match https://docs.google.com/document/d/1ABC.../edit
  const docMatch = trimmed.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (docMatch && docMatch[1]) return docMatch[1];

  // Match https://drive.google.com/file/d/1ABC.../view
  const driveMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) return driveMatch[1];

  // Match https://drive.google.com/open?id=1ABC...
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) return idParamMatch[1];

  // Assume raw ID
  return trimmed;
};

/**
 * Search user's Google Drive for Google Docs or Word documents
 */
export const searchDriveFiles = async (
  accessToken: string,
  searchTerm: string = ''
): Promise<GoogleDriveFile[]> => {
  try {
    let q = "trashed = false and (mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' or mimeType = 'text/plain')";
    
    if (searchTerm.trim()) {
      const sanitized = searchTerm.replace(/'/g, "\\'");
      q += ` and name contains '${sanitized}'`;
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        q
      )}&fields=files(id,name,mimeType,modifiedTime,webViewLink,iconLink)&pageSize=30&orderBy=modifiedTime desc`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Chyba při vyhledávání na Google Disku (${response.status})`);
    }

    const data = await response.json();
    return data.files || [];
  } catch (error: any) {
    console.error('Drive search error:', error);
    throw error;
  }
};

/**
 * Fetch document title and plain text from Google Docs or Google Drive
 */
export const fetchGoogleDocContent = async (
  accessToken: string,
  docUrlOrId: string
): Promise<{ title: string; text: string }> => {
  const fileId = extractDocIdFromUrl(docUrlOrId);
  if (!fileId) {
    throw new Error('Neplatné URL nebo ID Google dokumentu.');
  }

  // 1. Try Google Docs API first
  try {
    const docsResponse = await fetch(
      `https://docs.googleapis.com/v1/documents/${fileId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (docsResponse.ok) {
      const docData = await docsResponse.json();
      const title = docData.title || 'Bez názvu';
      let extractedText = '';

      if (docData.body && docData.body.content) {
        for (const element of docData.body.content) {
          if (element.paragraph) {
            for (const pElem of element.paragraph.elements || []) {
              if (pElem.textRun && pElem.textRun.content) {
                extractedText += pElem.textRun.content;
              }
            }
          } else if (element.table) {
            for (const row of element.table.tableRows || []) {
              for (const cell of row.tableCells || []) {
                for (const cContent of cell.content || []) {
                  if (cContent.paragraph) {
                    for (const pElem of cContent.paragraph.elements || []) {
                      if (pElem.textRun && pElem.textRun.content) {
                        extractedText += pElem.textRun.content + ' ';
                      }
                    }
                  }
                }
              }
              extractedText += '\n';
            }
          }
        }
      }

      if (extractedText.trim()) {
        return { title, text: extractedText.trim() };
      }
    }
  } catch (e) {
    console.warn('Docs API direct fetch failed, trying Drive export fallback...', e);
  }

  // 2. Fallback: Drive API export to text/plain
  try {
    const exportResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (exportResponse.ok) {
      const plainText = await exportResponse.text();
      // Fetch metadata for file title
      const metaRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=name`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      let title = 'Google Dokument';
      if (metaRes.ok) {
        const metaData = await metaRes.json();
        if (metaData.name) title = metaData.name;
      }

      return { title, text: plainText };
    }
  } catch (e) {
    console.warn('Drive export failed...', e);
  }

  throw new Error('Nepodařilo se načíst obsah dokumentu z Google Disku. Ujistěte se, že máte k dokumentu přístup.');
};
