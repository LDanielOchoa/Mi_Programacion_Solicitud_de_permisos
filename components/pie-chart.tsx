'use client'

import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface DataItem {
  name: string
  value: number
}

interface PieChartProps {
  data: DataItem[]
  title: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#8DD1E1', '#A4DE6C', '#D0ED57']

export default function CustomPieChart({ data, title }: PieChartProps) {
  const [showDialog, setShowDialog] = useState(false)

  const handleDoubleClick = () => {
    setShowDialog(true)
  }

  return (
    <>
      <div className="h-[300px]" onDoubleClick={handleDoubleClick}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
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

