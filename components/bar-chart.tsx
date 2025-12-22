'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface DataItem {
  name: string
  value: number
}

interface BarChartProps {
  data: DataItem[]
  title: string
}

export default function CustomBarChart({ data, title }: BarChartProps) {
  const [showDialog, setShowDialog] = useState(false)

  const handleDoubleClick = () => {
    setShowDialog(true)
  }

  return (
    <>
      <div className="h-[300px]" onDoubleClick={handleDoubleClick}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title} - Top 10</DialogTitle>
          </DialogHeader>
          <ul>
            {data.slice(0, 10).map((item, index) => (
              <li key={index} className="flex justify-between py-2 border-b">
                <span>{item.name}</span>
                <span>{item.value}</span>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  )
}

