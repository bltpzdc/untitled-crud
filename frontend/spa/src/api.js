/**
 * API service for interacting with the backend runs API
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/**
 * Upload a new run by uploading a zip archive
 * @param {File} zipFile - The zip archive file to upload
 * @returns {Promise<{id: number, status: string}>} The response containing the run ID and status
 * @throws {Error} If the upload fails or the file doesn't contain metadata.json
 */
export async function uploadRun(zipFile) {
  if (!(zipFile instanceof File)) {
    throw new Error('Expected a File object');
  }

  const formData = new FormData();
  formData.append('file', zipFile);

  const response = await fetch(`${API_BASE_URL}/runs`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload run: ${response.status} ${errorText}`);
  }

  return await response.json();
}

/**
 * Get metadata for a specific run by ID
 * @param {number} id - The unique identifier of the run
 * @returns {Promise<{id: number, metadata: {timestamp: string, failureCount: number, tags: string[]}}>} The run metadata
 * @throws {Error} If the request fails or the run is not found
 */
export async function getRunMetadata(id) {
  if (typeof id !== 'number' || id <= 0) {
    throw new Error('Invalid run ID');
  }

  const response = await fetch(`${API_BASE_URL}/runs/metadata/${id}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get run metadata: ${response.status} ${errorText}`);
  }

  return await response.json();
}

/**
 * Get metadata for all runs
 * @returns {Promise<Array<{id: number, metadata: {timestamp: string, failureCount: number, tags: string[]}}>>} Array of all runs metadata
 * @throws {Error} If the request fails
 */
export async function getAllRunsMetadata() {
  const response = await fetch(`${API_BASE_URL}/runs/metadatas`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get all runs metadata: ${response.status} ${errorText}`);
  }

  return await response.json();
}

/**
 * Download the original zip archive for a specific run
 * @param {number} id - The unique identifier of the run
 * @returns {Promise<Blob>} The zip archive as a Blob
 * @throws {Error} If the request fails or the run is not found
 */
export async function downloadRunArchive(id) {
  if (typeof id !== 'number' || id <= 0) {
    throw new Error('Invalid run ID');
  }

  const response = await fetch(`${API_BASE_URL}/runs/archive/${id}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to download run archive: ${response.status} ${errorText}`);
  }

  return await response.blob();
}

/**
 * Download the run archive and trigger a browser download
 * @param {number} id - The unique identifier of the run
 * @param {string} filename - Optional filename for the download (defaults to `run-${id}.zip`)
 * @returns {Promise<void>}
 * @throws {Error} If the download fails
 */
export async function downloadRunArchiveAsFile(id, filename = null) {
  const blob = await downloadRunArchive(id);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `run-${id}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

