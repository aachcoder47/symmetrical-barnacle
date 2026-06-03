export function readFileContent(buffer, mimeType) {
  return buffer.toString('utf-8');
}

export function extractFileName(filePath) {
  return filePath.split('/').pop().replace(/\.[^/.]+$/, '');
}
