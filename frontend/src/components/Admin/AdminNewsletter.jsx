import React from 'react'
import { NavLink } from 'react-router-dom';
import profiePic from '../../assets/human6.jpg'
function AdminNewsletter() {
    const navLinkStyle = ({ isActive }) => {
        return {
          fontWeight: isActive ? '600' : '400',
          color: isActive ? 'white' : 'black',
          backgroundColor: isActive ? "black":"white",
          
        };
      };

  return (
    <section className='bg-slate-300 flex justify-center items-center'>
        <div className='h-[80%] w-[80%] bg-white shadow-xl p-2 flex'>
            <div className='bg-slate- h-full w-[18%] flex flex-col justify-between p-2 '>
                <div className='flex flex-col gap-6'>
                    <div className='w-full flex flex-col items-center '>
                        <img src={profiePic} className='size-24 rounded-full' alt="profile" />
                        <p className='font-semibold text-xl'>Admin</p>
                    </div>
                    <div className='flex flex-col items-start w-full gap-3 '>
                        <NavLink style={navLinkStyle}  className={'w-full   p-2 h-[40px] '} to="/admin-dashboard">Dashboard</NavLink>
                        <NavLink style={navLinkStyle}  className={'w-full  p-2 h-[40px] '} to="/admin-doctor">Doctor</NavLink>
                        <NavLink style={navLinkStyle}  className={'w-full p-2 h-[40px] '} to="/admin-nurse">Nurse</NavLink>
                        <NavLink style={navLinkStyle}  className={'w-full p-2 h-[40px] '} to="/admin-patient">Patient</NavLink>
                        <NavLink style={navLinkStyle}  className={'w-full p-2 h-[40px] '} to="/admin-query">Query</NavLink>
                        <NavLink style={navLinkStyle}  className={'w-full p-2 h-[40px] '} to="/admin-newsletter">Newsletter</NavLink>
                    </div>
                </div>
                <div className='w-full text-center  h-[80px] p-2'>
                    <button className='bg-black text-white rounded-full text-md font-medium p-2 cursor-pointer hover:scale-110 duration-200 active:scale-90 '>Sign Out</button>
                </div>
            </div>
            <div className=' w-[70%] ms-24 p-4 flex flex-col justify-around bg-yellow-200'>
                    <p className='font-semibold text-3xl'>Dashboard</p>
                    <div></div>
                    
            </div>
        </div>
        
    </section>
  )
}

export default AdminNewsletter