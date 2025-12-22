'use client'

import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface DataItem {
  name: string
  value: number
}

interface LineChartProps {
  data: DataItem[]
  title: string
}

export default function CustomLineChart({ data, title }: LineChartProps) {
  const [showDialog, setShowDialog] = useState(false)

  const handleDoubleClick = () => {
    setShowDialog(true)
  }

  return (
    <>
      <div className="h-[300px]" onDoubleClick={handleDoubleClick}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#8884d8" />
          </LineChart>
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

