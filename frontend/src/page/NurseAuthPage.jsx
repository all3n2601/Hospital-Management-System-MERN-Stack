import React from 'react'
import Navbar from '../components/Shared/Navbar'
import NurseAuth from '../components/Auth/NurseAuth'
function NurseAuthPage() {
  return (
    <section>
        <Navbar/>
        <NurseAuth/>
    </section>
  )
}

export default NurseAuthPage