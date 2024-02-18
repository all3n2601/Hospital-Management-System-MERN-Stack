import React from 'react'
import { NavLink } from 'react-router-dom';
import profiePic from '../../../assets/human6.jpg'
import UserSidebar from './UserSidebar'

function UserMedication() {

    const userData = JSON.parse(localStorage.getItem('user'))

  return (
    <section className='bg-slate-300 flex justify-center items-center'>
        <div className='h-[80%] w-[80%] bg-white shadow-xl p-2 flex'>
        <UserSidebar profiePic={profiePic} userName={userData.userName} />
            <div className='overflow-auto  w-[70%] ms-24 p-4 flex flex-col  '>
                {/* main content comes here */}
                
            </div>
        </div>
        
    </section>
  )
}

export default UserMedication