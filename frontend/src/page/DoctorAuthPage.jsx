import React from 'react'
import DoctorAuth from '../components/Auth/DoctorAuth'
import Navbar from '../components/Shared/Navbar'
function DoctorAuthPage() {
  return (
    <section>
        <Navbar/>
        <DoctorAuth/>
    </section>
  )
}

export default DoctorAuthPage