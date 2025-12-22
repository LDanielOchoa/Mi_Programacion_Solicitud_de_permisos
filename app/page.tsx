'use client'

import { Suspense } from 'react'
import LoginPage from './login'

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPage />
    </Suspense>
  )
}
