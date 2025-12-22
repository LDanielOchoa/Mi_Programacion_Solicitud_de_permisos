export interface LoginResponse {
    access_token: string
    role: string
    msg?: string
}

export interface UserData {
    name?: string
    role?: string
    [key: string]: any
}

export interface DecodedToken {
    code: string
    password: string
    origin?: string
    exp?: number
}
