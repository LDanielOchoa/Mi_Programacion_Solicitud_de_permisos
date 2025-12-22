interface FileInfo {
    fileName: string
    fileUrl: string
  }
  
  interface Request {
    files?: string[] | FileInfo[]
    file_name?: string[]
    file_url?: string[]
    [key: string]: any
  }
  
  export function processFiles(request: Request): FileInfo[] {
    if (!request.files && !request.file_name && !request.file_url) return []
  
    // If files is an array of FileInfo objects
    if (Array.isArray(request.files) && request.files.length > 0 && typeof request.files[0] === 'object') {
      return request.files as FileInfo[]
    }
  
    // If we have separate file_name and file_url arrays
    if (Array.isArray(request.file_name) && Array.isArray(request.file_url)) {
      return request.file_name.map((name, index) => ({
        fileName: name,
        fileUrl: request.file_url![index]
      }))
    }
  
    // If files is an array of strings (old format)
    if (Array.isArray(request.files)) {
      return (request.files as string[]).map(file => ({
        fileName: file.replace(/[\[\]_]/g, ''), // Clean the filename
        fileUrl: file
      }))
    }
  
    return []
  }
  