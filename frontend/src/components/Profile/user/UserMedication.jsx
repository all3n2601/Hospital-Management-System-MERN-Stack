import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom';
import profiePic from '../../../assets/human6.jpg'
import UserSidebar from './UserSidebar'
import axios from 'axios';

function UserMedication() {

    const userData = JSON.parse(localStorage.getItem('user'))


    const [medicines , setMedicines] = useState([]);

    useEffect(() => {
      const fetchData = async () => {
        try {
          const response = await axios.get(`https://hmsmern.onrender.com/user/get-medications/${userData.email}`);
           
          const data = response.data;
          const medicationsArray = data.map(({ medications }) => medications);

  
          const detailsArray = medicationsArray.map(medications => medications.map(({ name, dosage, frequency }) => ({name , dosage, frequency })));


          setMedicines(detailsArray);
          
        } catch (error) {
          console.error('Error fetching users:', error);
  
        }
      };
    
      fetchData();
    
    }, []); 

  return (
    <section className='bg-slate-300 flex justify-center items-center'>
        <div className='h-[80%] w-[80%] bg-white shadow-xl p-2 flex'>
        <UserSidebar profiePic={profiePic} userName={userData.userName} />
        <div className=" w-[70%] ms-24 p-4 flex flex-col justify-start gap-5 ">
          <p className="font-semibold text-3xl">Medications</p>
          <div className="w-full">
            {!medicines? <p>Medications are not prescribed</p>:  <div className="relative overflow-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                      <th scope="col" className="px-6 py-3">
                        #
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Medicine Name
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Dosage
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Frequency
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicines.map((value , index) =>{
                      return(
                        <tr key={index}>
                          <td scope="col" className="px-6 py-3">
                            {index+1}
                          </td>
                          <td scope="col" className="px-6 py-3">
                            {value[0].name}
                          </td>
                          <td scope="col" className="px-6 py-3">
                            {value[0].dosage}
                          </td>
                          <td scope="col" className="px-6 py-3">
                            {value[0].frequency}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div> }
          </div>
  
        </div>
        </div>
        
    </section>
  )
}

export default UserMedication