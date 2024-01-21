import React from 'react'
import { NavLink } from 'react-router-dom';
import profiePic from '../../assets/human6.jpg'
function AdminDashboard() {
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
            <div className=' w-[70%] ms-24 p-4 flex flex-col justify-around '>
                    <p className='font-semibold text-3xl text-center'>Dashboard</p>
                    <div className='w-full  h-[80%] items-center flex flex-col gap-4'>
                        <div className='flex w-full justify-evenly h-[30%]'>
                            <div className='flex shadow-xl rounded-xl border border-2 border-slate-900 w-[30%] justify-center items-center'>
                                <span className='font-semibold text-xl'>Doctors: </span>           
                            </div>
                            <div className='flex shadow-xl rounded-xl border border-2 border-slate-900  w-[30%] justify-center items-center'>
                                <span className='font-semibold text-xl'>Nurses: </span>           
                            </div>
                        </div>
                        <div className='flex w-full  justify-evenly h-[30%]'>
                            <div className='flex shadow-xl rounded-xl border border-2 border-slate-900 w-[30%] justify-center items-center'>
                                <span className='font-semibold text-xl'>Patients: </span>           
                            </div>
                            <div className='flex  shadow-xl rounded-xl border border-2 border-slate-900 w-[30%] justify-center items-center'>
                                <span className='font-semibold text-xl'>Query: </span>           
                            </div>
                        </div>
                        <div className='flex shadow-xl rounded-xl border border-2 border-slate-900 w-[30%] h-[30%] justify-center items-center'>
                                <span className='font-semibold text-xl'>NewsLetter: </span>           
                        </div>
                    </div>
                    
            </div>
        </div>
        
    </section>
  )
}

export default AdminDashboard