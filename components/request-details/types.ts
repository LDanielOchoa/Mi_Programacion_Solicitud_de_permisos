import { LucideIcon } from "lucide-react"

export interface FileInfo {
    fileName: string
    fileUrl: string
}

export interface Request {
    id: string
    code: string
    name: string
    type: string
    time: string
    status: string
    createdAt: string
    description?: string
    zona?: string
    codeAM?: string
    codePM?: string
    shift?: string
    dates?: string[] | string
    files?: string[] | FileInfo[]
    file_name?: string[]
    file_url?: string[]
    noveltyType?: string
    reason?: string
    phone?: string
    cargo?: string
    fechaIngreso?: string
    operatorId?: string
    password?: string
}

export interface HistoryItem {
    id: string
    type: string
    createdAt: string
    status: string
    description?: string
    requestedDates?: string
    requestId?: string
    requestType?: string
}

export interface RequestDetailsProps {
    request: Request
    onClose: () => void
    onAction: (id: string, action: "approve" | "reject", reason: string) => void
    onPrevRequest?: () => void
    onNextRequest?: () => void
}
