import React from "react"

const LoadingSpinner = React.memo(() => (
  <div className="flex justify-center items-center h-96">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-emerald-100/30 rounded-full animate-spin"></div>
      <div className="absolute top-0 left-0 w-16 h-16 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
      <div
        className="absolute top-2 left-2 w-12 h-12 border-4 border-green-300 border-t-transparent rounded-full animate-spin"
        style={{ animationDelay: "150ms" }}
      ></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full animate-pulse"></div>
    </div>
  </div>
))

LoadingSpinner.displayName = "LoadingSpinner"

export default LoadingSpinner
