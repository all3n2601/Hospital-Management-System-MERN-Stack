import React, {useState , useEffect} from 'react'
import { NavLink } from 'react-router-dom';
import profiePic from '../../../assets/doct2.jpg'

function DoctorReview() {
    const [userData , setuserData] = useState([]);

    useEffect(() => {
        const fetchInfo = async (e) => {
          const user = JSON.parse(localStorage.getItem("user"));
          setuserData(user);
        };
    
        fetchInfo();
      }, []);


  return (
    <section className='bg-slate-300 flex justify-center items-center'>
        <div className='h-[80%] w-[80%] bg-white shadow-xl p-2 flex'>
            <DoctorSidebar userName={userData.name} profiePic={profiePic} />
            <div className=' w-[70%] ms-24 p-4 flex flex-col overflow-auto '>
                reviews comes here
            </div>
        </div>
        
    </section>
  )
}

export default DoctorReview