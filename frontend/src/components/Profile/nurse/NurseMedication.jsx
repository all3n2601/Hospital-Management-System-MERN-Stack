import React from 'react'
import { NavLink } from 'react-router-dom';
import profilePic from '../../../assets/doct5.jpg'
function NurseMedication() {
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
                <div className='flex flex-col gap-16'>
                    <div className='w-full flex flex-col items-center '>
                        <img src={profilePic} className='size-24 rounded-full' alt="profile" />
                        <p>Name</p>
                    </div>
                    <div className='flex flex-col items-start w-full gap-4 '>
                        <NavLink style={navLinkStyle} className={'w-full  p-2 h-[40px] '} to="/nurse-profile">Settings</NavLink>
                        <NavLink style={navLinkStyle} className={'w-full  p-2 h-[40px] '} to="/nurse-medication">Medication</NavLink>
                        <NavLink style={navLinkStyle}  className={'w-full p-2 h-[40px] '} to="/nurse-bed">Beds</NavLink>
                        
                    </div>
                </div>
                <div className='w-full text-center  h-[80px] p-2'>
                    <button className='bg-black text-white rounded-full text-md font-medium p-2 cursor-pointer hover:scale-110 duration-200 active:scale-90 '>Sign Out</button>
                </div>
            </div>
            <div className='overflow-auto  justify-center items-center w-[70%] ms-24 p-4 flex flex-col '>
                <form className='flex flex-col w-[60%] gap-10' action="">
                    <div>
                        <p>Enter Patient Name:</p>
                                    <select
                                        id="doctors"
                                        className="flex h-10 w-[90%] rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="Choose you Consultant">Choose Patient</option>
                                        <option value="D1">Patient 1</option>
                                        <option value="D2">Patient 2</option>
                                        <option value="D3">Patient 3</option>
                                    </select>
                    </div>
                                    <textarea
                                className="flex  w-[90%] rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                type="text"
                                rows="10"
                                placeholder="Medicine Prescription"
                                ></textarea>
                    <button className='bg-black text-white w-[90%] p-2 rounded-full'>Add Prescription</button>
                </form>
                
            </div>
        </div>
        
        
    </section>
  )
}

export default NurseMedication