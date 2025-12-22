'use client'

const WaveDivider = () => {
    return (
      <div className="absolute right-0 top-0 h-full w-1/3 lg:block hidden">
        <svg
          viewBox="0 0 500 960"
          fill="none"
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          <path
            d="M0 0C0 0 100 160 250 160C400 160 500 0 500 0V960C500 960 400 800 250 800C100 800 0 960 0 960V0Z"
            fill="white"
            className="drop-shadow-xl"
          />
        </svg>
      </div>
    )
  }
  
  export default WaveDivider
  
  