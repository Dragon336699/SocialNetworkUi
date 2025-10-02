import { Button } from 'antd'
import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className='flex items-center justify-center h-screen'>
        <Button type='primary' size='large' onClick={() => setCount(count + 1)}>
          Count: {count}
        </Button>
      </div>
    </>
  )
}

export default App
